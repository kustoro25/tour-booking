import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: { gallery: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!tour) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: tour });
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

    const tour = await prisma.tour.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.destination !== undefined && { destination: body.destination }),
        ...(body.destinationId !== undefined && { destinationId: body.destinationId || null }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.priceAdult !== undefined && { priceAdult: parseFloat(body.priceAdult) }),
        ...(body.priceChild !== undefined && { priceChild: parseFloat(body.priceChild) }),
        ...(body.discount !== undefined && { discount: parseFloat(body.discount) }),
        ...(body.maxSlot !== undefined && { maxSlot: parseInt(body.maxSlot) }),
        ...(body.minPax !== undefined && { minPax: parseInt(body.minPax) }),
        ...(body.itinerary !== undefined && { itinerary: typeof body.itinerary === 'string' ? body.itinerary : JSON.stringify(body.itinerary) }),
        ...(body.includes !== undefined && { includes: typeof body.includes === 'string' ? body.includes : JSON.stringify(body.includes) }),
        ...(body.excludes !== undefined && { excludes: typeof body.excludes === 'string' ? body.excludes : JSON.stringify(body.excludes) }),
        ...(body.terms !== undefined && { terms: body.terms }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.coverImg !== undefined && { coverImg: body.coverImg }),
      },
    });

    return NextResponse.json({ success: true, data: tour });
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
    await prisma.tour.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
