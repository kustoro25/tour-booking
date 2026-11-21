import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNo, calculateTotal, getExpiryDate, generateReviewToken } from '@/lib/utils';
import { validateBookingForm } from '@/lib/validators';
import { sendEmail, invoiceEmailTemplate, installmentBillingTemplate, adminOrderNotificationTemplate } from '@/lib/email';
import { generateInstallmentDates } from '@/lib/agreement';
import { getOwnerEmail, getCompanyName, getWhatsAppNumber } from '@/lib/settings';
import { notifyCustomerNewBooking, notifyAdminNewOrder } from '@/lib/whatsapp';
import {
  getFleetBySlug,
  getTransferPrice,
  isValidPickupTime,
  formatTime12h,
  getCarRentalBasePrice,
  calcCarRentalTotal,
  isUnlimitedQuota,
  TRANSFER_MAX_PAX,
} from '@/lib/haybali';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tourId,
      tourDate,
      customerName,
      customerEmail,
      customerPhone,
      adults,
      children,
      notes,
      paymentType,
      installmentCount,
      // Bahasa aktif pengunjung — dipakai untuk email yang menyesuaikan pembeli
      locale,
      // Layanan HAYBALI TRANS (sewa mobil & antar-jemput bandara)
      pickupArea,
      dropoffArea,
      pickupTime,
      duration,
      transferArea,
      direction,
      flightNo,
    } = body;

    // Validate
    const errors = validateBookingForm({ customerName, customerEmail, customerPhone, adults, children });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const isInstallment = paymentType === 'INSTALLMENT';
    // Bahasa pesanan: dipakai untuk email ke pembeli (id default).
    const orderLocale = locale === 'en' ? 'en' : 'id';
    // Skema DP: nilai 1 berarti DP di muka + 1 pelunasan (tunai ke sopir).
    const installmentNum = isInstallment ? (parseInt(String(installmentCount)) || 1) : 0;

    if (isInstallment && (installmentNum < 1 || installmentNum > 12)) {
      return NextResponse.json({ success: false, error: 'Jumlah angsuran tidak valid (1-12x)' }, { status: 400 });
    }

    // Check if installment is enabled from settings
    if (isInstallment) {
      const installmentSetting = await prisma.setting.findUnique({ where: { key: 'installment_enabled' } });
      if (!installmentSetting || JSON.parse(installmentSetting.value) !== true) {
        return NextResponse.json({ success: false, error: 'Fitur angsuran sedang tidak tersedia' }, { status: 400 });
      }
      // Validasi jumlah angsuran terhadap opsi yang diizinkan admin (default hanya 2x).
      // Nilai 1 selalu diizinkan: skema standar DP + pelunasan tunai ke sopir.
      const optionsSetting = await prisma.setting.findUnique({ where: { key: 'installment_options' } });
      let allowedOptions: number[] = [2];
      if (optionsSetting) {
        try {
          const parsed = JSON.parse(optionsSetting.value);
          if (Array.isArray(parsed)) allowedOptions = parsed.map(Number).filter((n) => !isNaN(n));
        } catch { /* gunakan default [2] */ }
      }
      if (installmentNum !== 1 && !allowedOptions.includes(installmentNum)) {
        return NextResponse.json({ success: false, error: 'Jumlah angsuran tidak tersedia' }, { status: 400 });
      }
    }

    if (!tourId || !tourDate) {
      return NextResponse.json({ success: false, error: 'Tour ID and date are required' }, { status: 400 });
    }

    const tour = await prisma.tour.findUnique({ where: { id: tourId, isActive: true } });
    if (!tour) {
      return NextResponse.json({ success: false, error: 'Tour not found' }, { status: 404 });
    }

    // Minimal peserta (konsisten dengan validasi di halaman booking)
    const requestedPax = (Number(adults) || 0) + (Number(children) || 0);
    if (requestedPax < tour.minPax) {
      return NextResponse.json(
        { success: false, error: `Minimal ${tour.minPax} peserta per pemesanan` },
        { status: 400 }
      );
    }

    // ========================================================================
    // HAYBALI TRANS — perhitungan harga khusus layanan sewa mobil & transfer
    // ========================================================================
    let serviceTotal: number | null = null; // total hasil perhitungan khusus (menggantikan hitung pax)
    let serviceSurcharge = 0; // biaya tambahan (jam penjemputan)
    let orderExtras: Record<string, unknown> | null = null; // rincian yang disimpan di kolom extras
    let forcedAdults: number | null = null; // jumlah peserta final untuk kategori khusus

    if (tour.category === 'CAR_RENTAL') {
      // Zona penjemputan & area tujuan diketik manual oleh tamu.
      const pickupZoneText = String(pickupArea || '').trim();
      const destinationText = String(dropoffArea || '').trim();
      const pickupTimeText = String(pickupTime || '').trim();
      if (pickupZoneText.length < 3 || destinationText.length < 3 || !pickupTimeText) {
        return NextResponse.json(
          { success: false, error: 'Zona penjemputan, jam penjemputan, dan area tujuan wajib diisi' },
          { status: 400 }
        );
      }
      // Jam penjemputan bebas menit, cukup valid 00:00–23:59 — sumber kebenaran biaya surcharge
      if (!isValidPickupTime(pickupTimeText)) {
        return NextResponse.json(
          { success: false, error: 'Jam penjemputan tidak valid. Gunakan format 12 jam, misalnya 7:15 AM.' },
          { status: 400 }
        );
      }

      // Durasi sewa: 6 jam hanya berlaku untuk armada dengan tarif 6 jam
      const rentalFleet = getFleetBySlug(tour.slug);
      const rentalDuration = duration === '6' ? 6 : 12;
      if (rentalDuration === 6 && (!rentalFleet || rentalFleet.price6h === null)) {
        return NextResponse.json(
          { success: false, error: 'Durasi 6 jam tidak tersedia untuk armada ini. Silakan pilih 12 jam.' },
          { status: 400 }
        );
      }

      // Biaya area tujuan tidak ikut dihitung — hanya informasi untuk admin.
      const quote = calcCarRentalTotal(
        getCarRentalBasePrice(tour.slug, rentalDuration),
        pickupTimeText
      );
      serviceTotal = quote.total;
      serviceSurcharge = quote.latePickupFee;
      orderExtras = {
        durationLabel: `${rentalDuration} Jam`,
        basePrice: quote.base,
        destinationArea: destinationText,
        latePickupFee: quote.latePickupFee,
      };
      forcedAdults = 1;
    } else if (tour.category === 'AIRPORT_TRANSFER') {
      if (!transferArea) {
        return NextResponse.json(
          { success: false, error: 'Area tujuan wajib dipilih' },
          { status: 400 }
        );
      }
      const pax = Number(adults) || 1;
      if (pax > TRANSFER_MAX_PAX) {
        return NextResponse.json(
          { success: false, error: 'Jumlah penumpang maksimal 10 orang' },
          { status: 400 }
        );
      }
      const price = getTransferPrice(String(transferArea), pax);
      if (price === null) {
        return NextResponse.json(
          { success: false, error: 'Area ini tidak melayani 6-10 penumpang. Silakan hubungi kami via WhatsApp.' },
          { status: 400 }
        );
      }
      serviceTotal = price;
      orderExtras = {
        direction: direction === 'DROP' ? 'DROP' : 'PICKUP',
        flightNo: flightNo || null,
        transferArea: String(transferArea),
        passengersTier: pax <= 5 ? '1-5' : '6-10',
      };
      forcedAdults = pax;
    }

    const finalAdults = forcedAdults ?? adults;
    const finalChildren = forcedAdults !== null ? 0 : children;

    const bookingDate = new Date(tourDate);
    const totalPax = finalAdults + finalChildren;
    // Sewa mobil tanpa batas kuota: berapa pun pesanan di tanggal yang sama
    // tetap diterima (armada tidak dihitung per slot). Tanggal blackout tetap ditolak.
    const unlimitedQuota = isUnlimitedQuota(tour.category);

    // Run booking creation inside a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Lock the slot row for update (prevents concurrent modifications)
      // If slot doesn't exist, we'll create it within the transaction
      const existingSlot = await tx.tourSlot.findUnique({
        where: { tourId_date: { tourId, date: bookingDate } },
      });

      // Check blackout date
      if (existingSlot?.isBlackout) {
        throw new Error('BLACKOUT');
      }

      // Check quota availability (dilewati untuk sewa mobil — tanpa batas kuota)
      if (!unlimitedQuota) {
        const maxQuota = existingSlot?.quota || tour.maxSlot;
        const currentBooked = existingSlot?.bookedCount || 0;

        if (currentBooked + totalPax > maxQuota) {
          throw new Error('SLOT_FULL');
        }
      }

      // Calculate total price
      // Kategori khusus (sewa mobil & transfer) memakai harga hasil perhitungan
      // layanan; paket tour reguler memakai perhitungan pax seperti biasa.
      const total =
        serviceTotal !== null
          ? serviceTotal
          : calculateTotal(
              existingSlot?.priceOverride || tour.priceAdult,
              tour.priceChild,
              finalAdults,
              finalChildren,
              tour.discount
            );

      const invoiceNo = generateInvoiceNo();
      const expiryAt = getExpiryDate(24);

      // Create order
      const order = await tx.order.create({
        data: {
          tourId,
          invoiceNo,
          customerName,
          customerEmail,
          customerPhone,
          tourDate: bookingDate,
          adults: finalAdults || 1,
          children: finalChildren || 0,
          total,
          status: 'PENDING',
          paymentType: isInstallment ? 'INSTALLMENT' : 'FULL',
          locale: orderLocale,
          notes: notes || null,
          reviewToken: generateReviewToken(),
          expiryAt,
          // Layanan HAYBALI TRANS
          pickupArea: pickupArea ? String(pickupArea) : null,
          dropoffArea: dropoffArea ? String(dropoffArea) : null,
          pickupTime: pickupTime ? String(pickupTime) : null,
          extras: orderExtras ? JSON.stringify(orderExtras) : null,
          surcharge: serviceSurcharge,
        },
      });

      // Create installment plan if applicable
      let installmentPlanData: {
        planId: string;
        dpPaymentId: string;
        dpAmount: number;
        dpPercentage: number;
        installmentCount: number;
        amountPerInstallment: number;
        dates: string[];
      } | null = null;

      if (isInstallment) {
        // Read DP percentage from settings
        let dpPct = 50;
        try {
          const dpSetting = await tx.setting.findUnique({ where: { key: 'dp_percentage' } });
          if (dpSetting) {
            const val = JSON.parse(dpSetting.value);
            if (typeof val === 'number') dpPct = val;
          }
        } catch { /* use default */ }

        const installmentInfo = generateInstallmentDates(installmentNum, dpPct, total);

        const plan = await tx.installmentPlan.create({
          data: {
            orderId: order.id,
            totalAmount: total,
            installmentCount: installmentNum,
            amountPerInstallment: installmentInfo.amountPerInstallment,
            downPayment: installmentInfo.downPayment,
            dpPercentage: dpPct,
            installmentDates: JSON.stringify(installmentInfo.dates),
            status: 'ACTIVE',
          },
        });

        // Record DP (uang muka) sebagai pembayaran ke-0 — batas bayar sama dengan expiry order (24 jam)
        const dpRecord = await tx.installmentPayment.create({
          data: {
            planId: plan.id,
            installmentNumber: 0,
            amount: installmentInfo.downPayment,
            dueDate: expiryAt,
            status: 'PENDING',
          },
        });

        // Create individual installment payment records
        for (let i = 0; i < installmentInfo.dates.length; i++) {
          await tx.installmentPayment.create({
            data: {
              planId: plan.id,
              installmentNumber: i + 1,
              amount: installmentInfo.amountPerInstallment,
              dueDate: new Date(installmentInfo.dates[i]),
              status: 'PENDING',
            },
          });
        }

        installmentPlanData = {
          planId: plan.id,
          dpPaymentId: dpRecord.id,
          dpAmount: installmentInfo.downPayment,
          dpPercentage: dpPct,
          installmentCount: installmentNum,
          amountPerInstallment: installmentInfo.amountPerInstallment,
          dates: installmentInfo.dates,
        };
      }

      // Update or create slot atomically
      await tx.tourSlot.upsert({
        where: { tourId_date: { tourId, date: bookingDate } },
        create: {
          tourId,
          date: bookingDate,
          quota: tour.maxSlot,
          bookedCount: totalPax,
        },
        update: {
          bookedCount: { increment: totalPax },
        },
      });

      // Create invoice record
      await tx.invoice.create({
        data: {
          orderId: order.id,
        },
      });

      return { order, invoiceNo, total, isInstallment, installmentPlanData };
    }, {
      isolationLevel: 'ReadCommitted',
      maxWait: 5000,  // max wait for transaction to start (ms)
      timeout: 10000, // max transaction duration (ms)
    });

    // ==== Email & WhatsApp (di luar transaksi, non-blocking) ====
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Nama brand dari setting admin (company_name), bukan env lama.
    const companyName = await getCompanyName();
    const waNumber = await getWhatsAppNumber();
    const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    const dateLabel = new Date(tourDate).toLocaleDateString(orderLocale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const tourDateLabel = pickupTime
      ? orderLocale === 'en'
        ? `${dateLabel}, at ${formatTime12h(String(pickupTime))} WITA`
        : `${dateLabel}, pukul ${formatTime12h(String(pickupTime))} WITA`
      : dateLabel;
    const expiryDate = getExpiryDate(24);
    const expiryLabel = `${expiryDate.toLocaleDateString(orderLocale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} ${orderLocale === 'en' ? 'at' : 'pukul'} ${expiryDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    // Link WhatsApp dengan pesan siap kirim — pelanggan tinggal lampirkan bukti transfer.
    const whatsappLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
      orderLocale === 'en'
        ? `Hello ${companyName}, I would like to confirm my payment for invoice ${result.invoiceNo}. I have attached the proof of transfer below.`
        : `Halo ${companyName}, saya ingin konfirmasi pembayaran untuk invoice ${result.invoiceNo}. Berikut saya lampirkan bukti transfernya.`
    )}`;

    // 1. Email ke pembeli
    try {
      if (result.isInstallment && result.installmentPlanData) {
        const ipd = result.installmentPlanData;
        const installmentUrl = `${siteUrl}/invoice/${result.invoiceNo}/installments`;

        // Read bank accounts (dipakai hanya saat mode transfer manual)
        let bankAccounts = [{ bank: 'BCA', number: '0402946260', name: 'Ni KADEK DESY MAHADEWI' }];
        try {
          const bankSetting = await prisma.setting.findUnique({ where: { key: 'bank_accounts' } });
          if (bankSetting) bankAccounts = JSON.parse(bankSetting.value);
        } catch { /* default */ }

        // Email penagihan DP (uang muka) — transfer manual, bukti dikirim via WhatsApp/email ke admin
        await sendEmail({
          to: customerEmail,
          subject: orderLocale === 'en'
            ? `Down Payment (DP) Invoice - ${tour.name}`
            : `Pembayaran DP (Uang Muka) - ${tour.name}`,
          html: installmentBillingTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            installmentNumber: 0,
            totalInstallments: ipd.installmentCount,
            amount: formatCur(ipd.dpAmount),
            dueDate: expiryDate.toLocaleDateString(orderLocale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            paymentUrl: installmentUrl,
            whatsappLink,
            bankAccounts,
            notes,
            companyName,
            lang: orderLocale,
          }),
        });
      } else {
        const invoicePageUrl = `${siteUrl}/invoice/${result.invoiceNo}`;
        await sendEmail({
          to: customerEmail,
          subject: orderLocale === 'en'
            ? `Your Invoice - ${tour.name}`
            : `Invoice Pesanan Anda - ${tour.name}`,
          html: invoiceEmailTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            tourDate: tourDateLabel,
            total: formatCur(result.total),
            expiryDate: expiryLabel,
            invoiceUrl: invoicePageUrl,
            whatsappLink,
            notes,
            companyName,
            lang: orderLocale,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

    // 3. Email notifikasi pesanan baru ke admin
    try {
      const adminEmail = await getOwnerEmail();
      await sendEmail({
        to: adminEmail,
        subject: `Pesanan Baru: ${result.invoiceNo} - ${customerName}`,
        html: adminOrderNotificationTemplate({
          customerName,
          customerEmail,
          customerPhone,
          tourName: tour.name,
          invoiceNo: result.invoiceNo,
          tourDate: tourDateLabel,
          total: formatCur(result.total),
          paymentType: result.isInstallment ? `Angsuran ${result.installmentPlanData?.installmentCount ?? ''}x` : 'Pembayaran Lunas',
          adminUrl: `${siteUrl}/admin/bookings/${result.order.id}`,
          notes,
          companyName,
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send admin notification email:', emailErr);
    }

    // 4. Notifikasi WhatsApp ke pembeli & admin (aman jika belum dikonfigurasi)
    const waData = {
      customerName,
      customerPhone,
      tourName: tour.name,
      tourDateLabel,
      invoiceNo: result.invoiceNo,
      totalLabel: formatCur(result.total),
      expiryLabel,
    };
    notifyCustomerNewBooking(waData).catch((err) => console.error('WA customer notify failed:', err));
    notifyAdminNewOrder(waData).catch((err) => console.error('WA admin notify failed:', err));

    return NextResponse.json({
      success: true,
      data: { invoiceNo: result.invoiceNo, orderId: result.order.id },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BLACKOUT') {
        return NextResponse.json({ success: false, error: 'Tanggal tidak tersedia untuk booking' }, { status: 400 });
      }
      if (error.message === 'SLOT_FULL') {
        return NextResponse.json({ success: false, error: 'Slot tidak mencukupi untuk jumlah peserta' }, { status: 400 });
      }
    }
    console.error('Create booking error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
