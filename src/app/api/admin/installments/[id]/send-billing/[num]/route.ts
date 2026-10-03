import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendEmail, installmentBillingTemplate } from '@/lib/email';
import { getPaymentGateway } from '@/lib/settings';

export async function POST(
  _request: NextRequest,
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

    // Mark as OVERDUE if past due
    if (payment.status === 'PENDING' && new Date(payment.dueDate) < new Date()) {
      await prisma.installmentPayment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' },
      });
    }

    // Send billing email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
    const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

    // Read bank accounts
    let bankAccounts = [{ bank: 'BCA', number: '1234567890', name: companyName }];
    try {
      const bankSetting = await prisma.setting.findUnique({ where: { key: 'bank_accounts' } });
      if (bankSetting) bankAccounts = JSON.parse(bankSetting.value);
    } catch { /* default */ }

    // Mode online (Midtrans): tombol email langsung ke halaman pembayaran Snap angsuran ini
    const gateway = await getPaymentGateway();
    const onlineMode = gateway === 'midtrans';
    const installmentsPageUrl = `${siteUrl}/invoice/${plan.order.invoiceNo}/installments`;
    const paymentUrl = onlineMode
      ? `${siteUrl}/api/installments/${plan.order.invoiceNo}/pay/${installmentNumber}`
      : installmentsPageUrl;
    const dueDateStr = new Date(payment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    await sendEmail({
      to: plan.order.customerEmail,
      subject:
        installmentNumber === 0
          ? `Pembayaran DP (Uang Muka) - ${plan.order.tour.name}`
          : `Penagihan Angsuran ke-${installmentNumber} - ${plan.order.tour.name}`,
      html: installmentBillingTemplate({
        customerName: plan.order.customerName,
        tourName: plan.order.tour.name,
        invoiceNo: plan.order.invoiceNo,
        installmentNumber,
        totalInstallments: plan.installmentCount,
        amount: formatCur(payment.amount),
        dueDate: dueDateStr,
        paymentUrl,
        bankAccounts,
        companyName,
        onlineMode,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Penagihan angsuran ke-${installmentNumber} telah dikirim ke ${plan.order.customerEmail}`,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
