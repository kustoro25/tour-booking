import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

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

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;

      // Regenerate slug when name changes
      const newSlug = slugify(body.name);

      // Check slug uniqueness (exclude current tour)
      const existingSlug = await prisma.tour.findFirst({
        where: { slug: newSlug, id: { not: id } },
        select: { id: true },
      });

      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: `Slug "${newSlug}" sudah digunakan oleh paket lain. Silakan ubah nama paket.` },
          { status: 409 }
        );
      }

      updateData.slug = newSlug;
    }

    if (body.category !== undefined) updateData.category = body.category;
    if (body.destination !== undefined) updateData.destination = body.destination;
    if (body.destinationId !== undefined) updateData.destinationId = body.destinationId || null;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.priceAdult !== undefined) updateData.priceAdult = parseFloat(body.priceAdult);
    if (body.priceChild !== undefined) updateData.priceChild = parseFloat(body.priceChild);
    if (body.discount !== undefined) updateData.discount = parseFloat(body.discount);
    if (body.maxSlot !== undefined) updateData.maxSlot = parseInt(body.maxSlot);
    if (body.minPax !== undefined) updateData.minPax = parseInt(body.minPax);
    if (body.itinerary !== undefined) {
      updateData.itinerary = typeof body.itinerary === 'string' ? body.itinerary : JSON.stringify(body.itinerary);
    }
    if (body.includes !== undefined) {
      updateData.includes = typeof body.includes === 'string' ? body.includes : JSON.stringify(body.includes);
    }
    if (body.excludes !== undefined) {
      updateData.excludes = typeof body.excludes === 'string' ? body.excludes : JSON.stringify(body.excludes);
    }
    if (body.terms !== undefined) updateData.terms = body.terms;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.coverImg !== undefined) updateData.coverImg = body.coverImg;

    const tour = await prisma.tour.update({
      where: { id },
      data: updateData,
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
