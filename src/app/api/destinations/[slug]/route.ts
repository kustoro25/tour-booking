import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const destination = await prisma.destination.findFirst({
      where: { slug, isActive: true },
      include: {
        _count: { select: { tours: true } },
        tours: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, priceAdult: true, duration: true, coverImg: true },
          take: 6,
        },
      },
    });

    if (!destination) {
      return NextResponse.json({ success: false, error: 'Destinasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: destination });
  } catch (error) {
    console.error('Get destination error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
