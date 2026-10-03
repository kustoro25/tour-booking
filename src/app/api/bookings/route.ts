import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNo, calculateTotal, getExpiryDate, generateReviewToken } from '@/lib/utils';
import { validateBookingForm } from '@/lib/validators';
import { sendEmail, invoiceEmailTemplate, installmentBillingTemplate, adminOrderNotificationTemplate } from '@/lib/email';
import { generateInstallmentDates } from '@/lib/agreement';
import { getPaymentGateway, getSetting } from '@/lib/settings';
import { createSnapTransaction, isMidtransConfigured } from '@/lib/midtrans';
import { notifyCustomerNewBooking, notifyAdminNewOrder } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, tourDate, customerName, customerEmail, customerPhone, adults, children, notes, paymentType, installmentCount } = body;

    // Validate
    const errors = validateBookingForm({ customerName, customerEmail, customerPhone, adults, children });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const isInstallment = paymentType === 'INSTALLMENT';
    const installmentNum = isInstallment ? (parseInt(String(installmentCount)) || 3) : 0;

    if (isInstallment && (installmentNum < 2 || installmentNum > 12)) {
      return NextResponse.json({ success: false, error: 'Jumlah angsuran tidak valid (2-12x)' }, { status: 400 });
    }

    // Check if installment is enabled from settings
    if (isInstallment) {
      const installmentSetting = await prisma.setting.findUnique({ where: { key: 'installment_enabled' } });
      if (!installmentSetting || JSON.parse(installmentSetting.value) !== true) {
        return NextResponse.json({ success: false, error: 'Fitur angsuran sedang tidak tersedia' }, { status: 400 });
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

    const bookingDate = new Date(tourDate);
    const totalPax = adults + children;

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

      // Check quota availability
      const maxQuota = existingSlot?.quota || tour.maxSlot;
      const currentBooked = existingSlot?.bookedCount || 0;

      if (currentBooked + totalPax > maxQuota) {
        throw new Error('SLOT_FULL');
      }

      // Calculate total price
      const total = calculateTotal(
        existingSlot?.priceOverride || tour.priceAdult,
        tour.priceChild,
        adults,
        children,
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
          adults: adults || 1,
          children: children || 0,
          total,
          status: 'PENDING',
          paymentType: isInstallment ? 'INSTALLMENT' : 'FULL',
          notes: notes || null,
          reviewToken: generateReviewToken(),
          expiryAt,
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
        let dpPct = 30;
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

    // ==== Pembayaran online, email & WhatsApp (di luar transaksi, non-blocking) ====
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
    const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    const tourDateLabel = new Date(tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const expiryDate = getExpiryDate(24);

    // 1. Buat transaksi Midtrans Snap (FULL) atau Snap DP (INSTALLMENT) jika gateway midtrans aktif
    let paymentUrl: string | null = null;
    if (!result.isInstallment) {
      try {
        const gateway = await getPaymentGateway();
        if (gateway === 'midtrans' && isMidtransConfigured()) {
          const snap = await createSnapTransaction({
            orderId: result.invoiceNo,
            grossAmount: result.total,
            itemName: tour.name,
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            expiryHours: 24,
            finishUrl: `${siteUrl}/invoice/${result.invoiceNo}`,
          });
          if (snap) {
            paymentUrl = snap.redirectUrl;
            await prisma.order.update({
              where: { id: result.order.id },
              data: { snapToken: snap.token, paymentUrl: snap.redirectUrl },
            });
          }
        }
      } catch (payErr) {
        console.error('Failed to create Midtrans transaction:', payErr);
      }
    } else if (result.installmentPlanData && result.installmentPlanData.dpAmount > 0) {
      // DP dibayar online — terkonfirmasi otomatis lewat webhook (pola order_id: {invoiceNo}-INST-0)
      try {
        const gateway = await getPaymentGateway();
        if (gateway === 'midtrans' && isMidtransConfigured()) {
          const ipd = result.installmentPlanData;
          const snap = await createSnapTransaction({
            orderId: `${result.invoiceNo}-INST-0`,
            grossAmount: ipd.dpAmount,
            itemName: `DP ${ipd.dpPercentage}% - ${tour.name}`,
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            expiryHours: 24,
            finishUrl: `${siteUrl}/invoice/${result.invoiceNo}/installments?pay=finish`,
          });
          if (snap) {
            paymentUrl = snap.redirectUrl;
            await prisma.installmentPayment.update({
              where: { id: ipd.dpPaymentId },
              data: {
                snapToken: snap.token,
                paymentUrl: snap.redirectUrl,
                paymentExpiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
            await prisma.order.update({
              where: { id: result.order.id },
              data: { snapToken: snap.token, paymentUrl: snap.redirectUrl },
            });
          }
        }
      } catch (payErr) {
        console.error('Failed to create Midtrans DP transaction:', payErr);
      }
    }

    // 2. Email ke pembeli
    try {
      if (result.isInstallment && result.installmentPlanData) {
        const ipd = result.installmentPlanData;
        const installmentUrl = `${siteUrl}/invoice/${result.invoiceNo}/installments`;

        // Read bank accounts (dipakai hanya saat mode transfer manual)
        let bankAccounts = [{ bank: 'BCA', number: '1234567890', name: companyName }];
        try {
          const bankSetting = await prisma.setting.findUnique({ where: { key: 'bank_accounts' } });
          if (bankSetting) bankAccounts = JSON.parse(bankSetting.value);
        } catch { /* default */ }

        // Email penagihan DP (uang muka) — tombol bayar online bila gateway aktif
        await sendEmail({
          to: customerEmail,
          subject: `Pembayaran DP (Uang Muka) - ${tour.name}`,
          html: installmentBillingTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            installmentNumber: 0,
            totalInstallments: ipd.installmentCount,
            amount: formatCur(ipd.dpAmount),
            dueDate: expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            paymentUrl: paymentUrl || installmentUrl,
            bankAccounts,
            companyName,
            onlineMode: Boolean(paymentUrl),
          }),
        });
      } else {
        const invoicePageUrl = `${siteUrl}/invoice/${result.invoiceNo}`;
        await sendEmail({
          to: customerEmail,
          subject: `Invoice Pesanan Anda - ${tour.name}`,
          html: invoiceEmailTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            tourDate: tourDateLabel,
            total: formatCur(result.total),
            expiryDate: expiryDate.toLocaleString('id-ID'),
            paymentUrl: invoicePageUrl,
            companyName,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

    // 3. Email notifikasi pesanan baru ke admin
    try {
      const adminEmail = (await getSetting<string>('company_email', '')) || process.env.ADMIN_EMAIL || 'admin@tourbooking.com';
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
      expiryLabel: expiryDate.toLocaleString('id-ID'),
    };
    notifyCustomerNewBooking(waData).catch((err) => console.error('WA customer notify failed:', err));
    notifyAdminNewOrder(waData).catch((err) => console.error('WA admin notify failed:', err));

    return NextResponse.json({
      success: true,
      data: { invoiceNo: result.invoiceNo, orderId: result.order.id, paymentUrl },
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
