import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonSafe } from '@/lib/utils';
import type { ItineraryDay } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tour = await prisma.tour.findUnique({
      where: { slug, isActive: true },
      include: {
        gallery: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          include: { order: { select: { customerName: true } } },
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!tour) {
      return NextResponse.json({ success: false, error: 'Tour not found' }, { status: 404 });
    }

    const avgRating =
      tour.reviews.length > 0
        ? tour.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / tour.reviews.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...tour,
        itinerary: parseJsonSafe<ItineraryDay[]>(tour.itinerary, []),
        includes: parseJsonSafe<string[]>(tour.includes, []),
        excludes: parseJsonSafe<string[]>(tour.excludes, []),
        avgRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Get tour error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
