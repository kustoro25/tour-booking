import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const destination = await prisma.destination.findUnique({ where: { id } });
    if (!destination) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: destination });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription;
    if (body.description !== undefined) data.description = body.description;
    if (body.location !== undefined) data.location = body.location;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.gallery !== undefined) data.gallery = typeof body.gallery === 'string' ? body.gallery : JSON.stringify(body.gallery);
    if (body.rating !== undefined) data.rating = parseFloat(body.rating);
    if (body.reviewCount !== undefined) data.reviewCount = parseInt(body.reviewCount);
    if (body.bestTimeToVisit !== undefined) data.bestTimeToVisit = body.bestTimeToVisit;
    if (body.activities !== undefined) data.activities = typeof body.activities === 'string' ? body.activities : JSON.stringify(body.activities);
    if (body.highlight !== undefined) data.highlight = body.highlight;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder);

    const destination = await prisma.destination.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: destination });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.destination.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
