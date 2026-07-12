import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    const { invoiceNo } = await params;

    const order = await prisma.order.findUnique({
      where: { invoiceNo },
      include: {
        tour: { select: { name: true, duration: true, destination: true, coverImg: true } },
        installmentPlan: {
          include: {
            payments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    if (order.paymentType !== 'INSTALLMENT' || !order.installmentPlan) {
      return NextResponse.json({ success: false, error: 'Pesanan ini bukan pembayaran angsuran' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        plan: order.installmentPlan,
        payments: order.installmentPlan.payments,
      },
    });
  } catch (error) {
    console.error('Get installment error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
