import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const VALID_REVIEW_STATUSES = ['PENDING', 'APPROVED', 'HIDDEN'] as const;
type ReviewStatus = (typeof VALID_REVIEW_STATUSES)[number];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, adminReply } = body;

    // Validate status enum
    if (status && !VALID_REVIEW_STATUSES.includes(status as ReviewStatus)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Gunakan: ${VALID_REVIEW_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminReply !== undefined) updateData.adminReply = adminReply;

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
