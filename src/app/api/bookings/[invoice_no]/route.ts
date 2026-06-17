import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoice_no: string }> }
) {
  try {
    const { invoice_no } = await params;
    const order = await prisma.order.findUnique({
      where: { invoiceNo: invoice_no },
      include: { tour: { select: { name: true, duration: true } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
