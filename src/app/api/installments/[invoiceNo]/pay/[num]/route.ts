import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string; num: string }> }
) {
  try {
    const { invoiceNo, num } = await params;
    const installmentNumber = parseInt(num);
    const body = await request.json();
    const { paymentProof } = body;

    if (!paymentProof || typeof paymentProof !== 'string') {
      return NextResponse.json({ success: false, error: 'Bukti transfer diperlukan' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNo },
      include: { installmentPlan: true },
    });

    if (!order || !order.installmentPlan) {
      return NextResponse.json({ success: false, error: 'Pesanan angsuran tidak ditemukan' }, { status: 404 });
    }

    const plan = order.installmentPlan;

    // Find the specific installment payment
    const payment = await prisma.installmentPayment.findUnique({
      where: {
        planId_installmentNumber: {
          planId: plan.id,
          installmentNumber,
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Angsuran tidak ditemukan' }, { status: 404 });
    }

    if (payment.status === 'CONFIRMED') {
      return NextResponse.json({ success: false, error: 'Angsuran ini sudah dikonfirmasi' }, { status: 400 });
    }

    // Update payment proof and status
    await prisma.installmentPayment.update({
      where: { id: payment.id },
      data: {
        paymentProof,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil diunggah. Menunggu konfirmasi admin.',
    });
  } catch (error) {
    console.error('Upload installment proof error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
