import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  try {
    await requireAdmin();
    const { id, num } = await params;
    const installmentNumber = parseInt(num);
    const body = await request.json();
    const { dueDate } = body;

    if (!dueDate || typeof dueDate !== 'string') {
      return NextResponse.json({ success: false, error: 'Tanggal jatuh tempo diperlukan' }, { status: 400 });
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Format tanggal tidak valid' }, { status: 400 });
    }

    const plan = await prisma.installmentPlan.findUnique({
      where: { id },
      include: { payments: { orderBy: { installmentNumber: 'asc' } } },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Rencana angsuran tidak ditemukan' }, { status: 404 });
    }

    const payment = plan.payments.find((p) => p.installmentNumber === installmentNumber);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Angsuran tidak ditemukan' }, { status: 404 });
    }

    await prisma.installmentPayment.update({
      where: { id: payment.id },
      data: { dueDate: parsedDate },
    });

    // Also update the installmentDates JSON in the plan
    const dates: string[] = JSON.parse(plan.installmentDates || '[]');
    if (dates.length >= installmentNumber) {
      dates[installmentNumber - 1] = parsedDate.toISOString();
      await prisma.installmentPlan.update({
        where: { id },
        data: { installmentDates: JSON.stringify(dates) },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Tanggal jatuh tempo angsuran ke-${installmentNumber} berhasil diperbarui`,
      data: { dueDate: parsedDate.toISOString() },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update due date error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
