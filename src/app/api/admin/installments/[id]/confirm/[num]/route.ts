import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, installmentConfirmationTemplate, installmentBillingTemplate } from '@/lib/email';
import { notifyCustomerPaymentReceived } from '@/lib/whatsapp';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  try {
    await requireAdmin();
    const { id, num } = await params;
    const installmentNumber = parseInt(num);

    const plan = await prisma.installmentPlan.findUnique({
      where: { id },
      include: {
        order: {
          include: { tour: { select: { name: true } } },
        },
        payments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const payment = plan.payments.find((p) => p.installmentNumber === installmentNumber);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Installment payment not found' }, { status: 404 });
    }

    // Confirm the payment
    await prisma.installmentPayment.update({
      where: { id: payment.id },
      data: {
        status: 'CONFIRMED',
        adminConfirmedAt: new Date(),
      },
    });

    // Check if all installments are now confirmed
    const updatedPayments = await prisma.installmentPayment.findMany({
      where: { planId: id },
      orderBy: { installmentNumber: 'asc' },
    });

    const allConfirmed = updatedPayments.every((p) => p.status === 'CONFIRMED');
    if (allConfirmed) {
      await prisma.installmentPlan.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
    }

    // Send confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
    const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

    const remaining = updatedPayments.filter((p) => p.status !== 'CONFIRMED').length;
    const nextPayment = updatedPayments.find((p) => p.status === 'PENDING');
    const nextDueDate = nextPayment
      ? new Date(nextPayment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    sendEmail({
      to: plan.order.customerEmail,
      subject: `Pembayaran Angsuran ke-${installmentNumber} Dikonfirmasi - ${plan.order.tour.name}`,
      html: installmentConfirmationTemplate({
        customerName: plan.order.customerName,
        tourName: plan.order.tour.name,
        invoiceNo: plan.order.invoiceNo,
        installmentNumber,
        amount: formatCur(payment.amount),
        remainingInstallments: remaining,
        nextDueDate,
        companyName,
      }),
    }).catch((err) => console.error('Confirmation email failed:', err));

    // Notifikasi WhatsApp ke pembeli (non-blocking)
    notifyCustomerPaymentReceived({
      customerPhone: plan.order.customerPhone,
      customerName: plan.order.customerName,
      invoiceNo: plan.order.invoiceNo,
      amountLabel: formatCur(payment.amount),
    }).catch((err) => console.error('Confirmation WA failed:', err));

    return NextResponse.json({
      success: true,
      message: `Angsuran ke-${installmentNumber} berhasil dikonfirmasi`,
      allConfirmed,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
