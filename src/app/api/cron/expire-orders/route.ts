// Cron: batalkan otomatis order FULL yang masih PENDING melewati batas pembayaran (expiryAt)
// dan lepaskan kuota slot-nya. Sekaligus tandai angsuran yang lewat jatuh tempo sebagai OVERDUE.
// Proteksi: header Authorization: Bearer <CRON_SECRET> (di-set otomatis oleh Vercel Cron).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentType: 'FULL',
        expiryAt: { lt: new Date() },
      },
      select: { id: true, invoiceNo: true, tourId: true, tourDate: true, adults: true, children: true },
    });

    let cancelled = 0;
    for (const order of expiredOrders) {
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        // Lepaskan kuota slot
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
        cancelled++;
      } catch (err) {
        console.error('Expire order failed:', order.invoiceNo, err);
      }
    }

    // Tandai angsuran yang lewat jatuh tempo
    const overdue = await prisma.installmentPayment.updateMany({
      where: { status: 'PENDING', dueDate: { lt: new Date() } },
      data: { status: 'OVERDUE' },
    });

    return NextResponse.json({
      success: true,
      data: {
        checked: expiredOrders.length,
        cancelled,
        overdueInstallments: overdue.count,
      },
    });
  } catch (error) {
    console.error('Cron expire-orders error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
