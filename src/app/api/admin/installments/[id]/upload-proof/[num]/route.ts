import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  try {
    await requireAdmin();
    const { id, num } = await params;
    const installmentNumber = parseInt(num);
    const body = await request.json();
    const { paymentProof } = body;

    if (!paymentProof || typeof paymentProof !== 'string') {
      return NextResponse.json({ success: false, error: 'URL bukti transfer diperlukan' }, { status: 400 });
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
      data: {
        paymentProof,
        status: payment.status === 'PENDING' || payment.status === 'OVERDUE' ? 'PAID' : payment.status,
        paidAt: payment.paidAt || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bukti transfer angsuran ke-${installmentNumber} berhasil diunggah`,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Upload installment proof error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
