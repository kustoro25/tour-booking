import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, reviewRequestTemplate, paymentConfirmationTemplate } from '@/lib/email';
import { notifyCustomerPaymentReceived } from '@/lib/whatsapp';
import { sendOrderTicketEmail } from '@/lib/eticket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const booking = await prisma.order.findUnique({
      where: { id },
      include: { tour: true, invoice: true, review: true },
    });
    if (!booking) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Find the order first to get tourId and tourDate for slot cleanup
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Delete the order (cascades to Invoice & Review)
    await prisma.order.delete({ where: { id } });

    // Decrement booked count on the corresponding tour slot
    const slot = await prisma.tourSlot.findUnique({
      where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
    });
    if (slot) {
      const totalPax = order.adults + order.children;
      await prisma.tourSlot.update({
        where: { id: slot.id },
        data: { bookedCount: Math.max(0, slot.bookedCount - totalPax) },
      });
    }

    return NextResponse.json({ success: true, message: 'Booking deleted' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    // Fetch current order to check old status & get review token
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { tour: { select: { name: true } } },
    });
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const booking = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    const newStatus = status || currentOrder.status;

    // Notifikasi pembayaran dikonfirmasi (email + WA) saat status berubah ke CONFIRMED
    if (newStatus === 'CONFIRMED' && currentOrder.status !== 'CONFIRMED' && currentOrder.status !== 'COMPLETED') {
      const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
      const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

      sendEmail({
        to: currentOrder.customerEmail,
        subject: `Pembayaran Dikonfirmasi - ${currentOrder.tour.name}`,
        html: paymentConfirmationTemplate({
          customerName: currentOrder.customerName,
          tourName: currentOrder.tour.name,
          invoiceNo: currentOrder.invoiceNo,
          tourDate: new Date(currentOrder.tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          companyName,
        }),
      }).catch((err) => console.error('Payment confirmation email failed:', err));

      notifyCustomerPaymentReceived({
        customerPhone: currentOrder.customerPhone,
        customerName: currentOrder.customerName,
        invoiceNo: currentOrder.invoiceNo,
        amountLabel: formatCur(currentOrder.total),
      }).catch((err) => console.error('Payment confirmation WA failed:', err));
    }

    // E-Ticket otomatis begitu pembayaran lunas terkonfirmasi (anti-duplikat via eticketSentAt)
    if ((newStatus === 'CONFIRMED' || newStatus === 'COMPLETED') && currentOrder.status !== newStatus) {
      sendOrderTicketEmail(id).catch((err) => console.error('E-ticket email failed:', err));
    }

    // Auto-send review request when status changes to COMPLETED
    if (newStatus === 'COMPLETED' && currentOrder.status !== 'COMPLETED' && !currentOrder.reviewSentAt) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';

      // Send review email (non-blocking)
      sendEmail({
        to: currentOrder.customerEmail,
        subject: `Bagaimana Pengalaman Tour ${currentOrder.tour.name} Anda?`,
        html: reviewRequestTemplate({
          customerName: currentOrder.customerName,
          tourName: currentOrder.tour.name,
          reviewUrl: `${siteUrl}/review/${currentOrder.reviewToken}`,
          companyName,
        }),
      }).then(async (sent) => {
        if (sent) {
          // Mark that review email has been sent
          await prisma.order.update({
            where: { id },
            data: { reviewSentAt: new Date() },
          });
        }
      }).catch((err) => {
        console.error('Failed to send review email:', err);
      });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
