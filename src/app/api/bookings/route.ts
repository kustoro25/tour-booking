import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNo, calculateTotal, getExpiryDate, generateReviewToken } from '@/lib/utils';
import { validateBookingForm } from '@/lib/validators';
import { sendEmail, invoiceEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, tourDate, customerName, customerEmail, customerPhone, adults, children, notes } = body;

    // Validate
    const errors = validateBookingForm({ customerName, customerEmail, customerPhone, adults, children });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
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
          notes: notes || null,
          reviewToken: generateReviewToken(),
          expiryAt: getExpiryDate(24),
        },
      });

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

      return { order, invoiceNo, total };
    }, {
      isolationLevel: 'ReadCommitted',
      maxWait: 5000,  // max wait for transaction to start (ms)
      timeout: 10000, // max transaction duration (ms)
    });

    // Send email notification (outside transaction, non-blocking)
    try {
      const paymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invoice/${result.invoiceNo}`;
      await sendEmail({
        to: customerEmail,
        subject: `Invoice Pesanan Anda - ${tour.name}`,
        html: invoiceEmailTemplate({
          customerName,
          tourName: tour.name,
          invoiceNo: result.invoiceNo,
          tourDate: new Date(tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          total: `Rp ${result.total.toLocaleString('id-ID')}`,
          expiryDate: getExpiryDate(24).toLocaleString('id-ID'),
          paymentUrl,
          companyName: process.env.COMPANY_NAME || 'Jelajah Nusantara Tour',
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send invoice email:', emailErr);
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
