import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();
    const tours = await prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
    return NextResponse.json({ success: true, data: tours, total: tours.length });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      name, category, destination, duration,
      priceAdult, priceChild, discount, maxSlot, minPax,
      itinerary, includes, excludes, terms, isActive, coverImg,
    } = body;

    const slug = slugify(name);

    const tour = await prisma.tour.create({
      data: {
        name,
        slug,
        category: category || 'OPEN_TRIP',
        destination: destination || '',
        duration: duration || '',
        priceAdult: parseFloat(priceAdult) || 0,
        priceChild: parseFloat(priceChild) || 0,
        discount: parseFloat(discount) || 0,
        maxSlot: parseInt(maxSlot) || 15,
        minPax: parseInt(minPax) || 2,
        itinerary: typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary || []),
        includes: typeof includes === 'string' ? includes : JSON.stringify(includes || []),
        excludes: typeof excludes === 'string' ? excludes : JSON.stringify(excludes || []),
        terms: terms || '',
        isActive: isActive !== undefined ? isActive : true,
        coverImg: coverImg || null,
      },
    });

    return NextResponse.json({ success: true, data: tour }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create tour error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
