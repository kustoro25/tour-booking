import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();
    const destinations = await prisma.destination.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tours: true } } },
    });
    return NextResponse.json({ success: true, data: destinations, total: destinations.length });
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
      name, shortDescription, description, location,
      imageUrl, gallery, rating, reviewCount,
      bestTimeToVisit, activities, highlight, isActive,
    } = body;

    const slug = slugify(name);

    const destination = await prisma.destination.create({
      data: {
        name,
        slug,
        shortDescription: shortDescription || '',
        description: description || '',
        location: location || '',
        imageUrl: imageUrl || '',
        gallery: typeof gallery === 'string' ? gallery : JSON.stringify(gallery || []),
        rating: parseFloat(rating) || 5.0,
        reviewCount: parseInt(reviewCount) || 0,
        bestTimeToVisit: bestTimeToVisit || '',
        activities: typeof activities === 'string' ? activities : JSON.stringify(activities || []),
        highlight: highlight !== undefined ? highlight : false,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: destination }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create destination error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
