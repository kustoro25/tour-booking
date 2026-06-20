import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where = search
      ? { email: { contains: search.toLowerCase(), mode: 'insensitive' as const } }
      : {};

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.newsletter.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: subscribers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, email } = await request.json();

    if (id) {
      await prisma.newsletter.delete({ where: { id } });
    } else if (email) {
      await prisma.newsletter.delete({ where: { email } });
    } else {
      return NextResponse.json({ success: false, error: 'id atau email diperlukan' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Subscriber berhasil dihapus' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Gagal menghapus subscriber' }, { status: 500 });
  }
}
