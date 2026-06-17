import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const tourId = searchParams.get('tourId');

    const where: Record<string, unknown> = { status: 'APPROVED' };
    if (rating) where.rating = parseInt(rating);
    if (tourId) where.tourId = tourId;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        order: { select: { customerName: true } },
        tour: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
