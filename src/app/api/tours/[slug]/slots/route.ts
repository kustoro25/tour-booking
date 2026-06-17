import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    // The param can be either a slug or an ID — try both
    const tour = await prisma.tour.findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { id: slug }],
      },
    });
    if (!tour) {
      return NextResponse.json({ success: false, error: 'Tour not found' }, { status: 404 });
    }

    // Get slots for the tour
    let slots;
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Last day of month

      slots = await prisma.tourSlot.findMany({
        where: {
          tourId: tour.id,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      });
    } else {
      // Default: current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      slots = await prisma.tourSlot.findMany({
        where: {
          tourId: tour.id,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      });
    }

    return NextResponse.json({ success: true, data: slots });
  } catch (error) {
    console.error('Get slots error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
