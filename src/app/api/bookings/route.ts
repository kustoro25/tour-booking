import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNo, calculateTotal, getExpiryDate, generateReviewToken } from '@/lib/utils';
import { validateBookingForm } from '@/lib/validators';
import { sendEmail, invoiceEmailTemplate, installmentAgreementTemplate, installmentBillingTemplate } from '@/lib/email';
import { generateInstallmentDates } from '@/lib/agreement';

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
          expiryAt: getExpiryDate(24),
        },
      });

      // Create installment plan if applicable
      let installmentPlanData: {
        planId: string;
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

    // Send email notification (outside transaction, non-blocking)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';

    try {
      const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

      if (result.isInstallment && result.installmentPlanData) {
        const ipd = result.installmentPlanData;
        const agreementUrl = `${siteUrl}/invoice/${result.invoiceNo}/installments`;

        await sendEmail({
          to: customerEmail,
          subject: `Perjanjian Pembiayaan Angsuran - ${tour.name}`,
          html: installmentAgreementTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            total: formatCur(result.total),
            installmentCount: ipd.installmentCount,
            amountPerInstallment: formatCur(ipd.amountPerInstallment),
            downPayment: formatCur(ipd.dpAmount),
            agreementUrl,
            companyName,
          }),
        });

        // Also send first billing notification for the first installment
        if (ipd.dates.length > 0) {
          const firstDueDate = new Date(ipd.dates[0]).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          await sendEmail({
            to: customerEmail,
            subject: `Penagihan Angsuran ke-1 - ${tour.name}`,
            html: installmentBillingTemplate({
              customerName,
              tourName: tour.name,
              invoiceNo: result.invoiceNo,
              installmentNumber: 1,
              totalInstallments: ipd.installmentCount,
              amount: formatCur(ipd.amountPerInstallment),
              dueDate: firstDueDate,
              paymentUrl: agreementUrl,
              bankAccounts: [{ bank: 'BCA', number: '1234567890', name: companyName }],
              companyName,
            }),
          });
        }
      } else {
        const paymentUrl = `${siteUrl}/invoice/${result.invoiceNo}`;
        await sendEmail({
          to: customerEmail,
          subject: `Invoice Pesanan Anda - ${tour.name}`,
          html: invoiceEmailTemplate({
            customerName,
            tourName: tour.name,
            invoiceNo: result.invoiceNo,
            tourDate: new Date(tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            total: formatCur(result.total),
            expiryDate: getExpiryDate(24).toLocaleString('id-ID'),
            paymentUrl,
            companyName,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

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
