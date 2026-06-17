import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, reviewRequestTemplate } from '@/lib/email';

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

    // Auto-send review request when status changes to COMPLETED
    const newStatus = status || currentOrder.status;
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
