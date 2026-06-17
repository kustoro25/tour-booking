import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: tourId } = await params;
    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // Format: YYYY-MM
    const year = url.searchParams.get('year');

    const where: Record<string, unknown> = { tourId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);
      where.date = { gte: startDate, lte: endDate };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      where.date = { gte: startDate, lte: endDate };
    }

    const slots = await prisma.tourSlot.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: slots });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: tourId } = await params;
    const body = await request.json();
    const { date, quota, priceOverride, isBlackout } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const slot = await prisma.tourSlot.upsert({
      where: {
        tourId_date: {
          tourId,
          date: new Date(date),
        },
      },
      update: {
        quota: quota !== undefined ? parseInt(quota) : undefined,
        priceOverride: priceOverride !== undefined ? parseFloat(priceOverride) : null,
        isBlackout: isBlackout !== undefined ? isBlackout : false,
      },
      create: {
        tourId,
        date: new Date(date),
        quota: parseInt(quota) || 15,
        priceOverride: priceOverride ? parseFloat(priceOverride) : null,
        isBlackout: isBlackout || false,
      },
    });

    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Slot update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: tourId } = await params;
    const body = await request.json();
    const { slotId } = body;

    if (!slotId) {
      return NextResponse.json({ success: false, error: 'slotId required' }, { status: 400 });
    }

    await prisma.tourSlot.delete({ where: { id: slotId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
