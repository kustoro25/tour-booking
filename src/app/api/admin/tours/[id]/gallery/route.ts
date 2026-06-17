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
    const images = await prisma.galleryImage.findMany({
      where: { tourId: id },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ success: true, data: images });
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
    const { imageUrl, altText } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'URL gambar wajib diisi' }, { status: 400 });
    }

    const count = await prisma.galleryImage.count({ where: { tourId } });
    if (count >= 10) {
      return NextResponse.json({ success: false, error: 'Maksimal 10 foto per paket' }, { status: 400 });
    }

    const image = await prisma.galleryImage.create({
      data: {
        tourId,
        imageUrl,
        altText: altText || '',
        sortOrder: count,
      },
    });

    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Gallery upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: tourId } = await params;
    const body = await request.json();
    const { images } = body; // Array of { id, altText, sortOrder }

    if (!Array.isArray(images)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    // Update each image
    for (const img of images) {
      await prisma.galleryImage.update({
        where: { id: img.id },
        data: {
          ...(img.altText !== undefined && { altText: img.altText }),
          ...(img.sortOrder !== undefined && { sortOrder: img.sortOrder }),
        },
      });
    }

    const updated = await prisma.galleryImage.findMany({
      where: { tourId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: updated });
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
    const { id: tourId } = await params;
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json({ success: false, error: 'imageId required' }, { status: 400 });
    }

    await prisma.galleryImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
