// Pembayaran angsuran:
// - GET  : buat/pakai ulang transaksi Midtrans Snap untuk satu angsuran (0 = DP), lalu redirect.
// - POST : unggah bukti transfer manual (hanya saat gateway = manual).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway } from '@/lib/settings';
import { createSnapTransaction, isMidtransConfigured } from '@/lib/midtrans';

const SNAP_EXPIRY_HOURS = 24;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string; num: string }> }
) {
  const { invoiceNo, num } = await params;
  const installmentNumber = parseInt(num);
  const installmentsUrl = new URL(`/invoice/${invoiceNo}/installments`, request.url);
  const failUrl = new URL(`/invoice/${invoiceNo}/installments?pay=failed`, request.url);

  try {
    if (!Number.isInteger(installmentNumber) || installmentNumber < 0) {
      return NextResponse.redirect(installmentsUrl);
    }
    if (!isMidtransConfigured()) {
      return NextResponse.redirect(installmentsUrl);
    }
    const gateway = await getPaymentGateway();
    if (gateway !== 'midtrans') {
      return NextResponse.redirect(installmentsUrl);
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNo },
      include: {
        tour: { select: { name: true } },
        installmentPlan: { include: { payments: true } },
      },
    });

    if (!order || !order.installmentPlan || order.status === 'CANCELLED') {
      return NextResponse.redirect(installmentsUrl);
    }

    const payment = order.installmentPlan.payments.find(
      (p) => p.installmentNumber === installmentNumber
    );
    if (!payment || payment.status === 'CONFIRMED') {
      return NextResponse.redirect(installmentsUrl);
    }

    // Pakai kembali link Snap yang masih berlaku
    if (payment.paymentUrl && payment.paymentExpiryAt && payment.paymentExpiryAt.getTime() > Date.now()) {
      return NextResponse.redirect(payment.paymentUrl);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const label =
      installmentNumber === 0
        ? `DP ${order.installmentPlan.dpPercentage}%`
        : `Angsuran ke-${installmentNumber}`;

    const snap = await createSnapTransaction({
      orderId: `${order.invoiceNo}-INST-${installmentNumber}`,
      grossAmount: payment.amount,
      itemName: `${label} - ${order.tour.name}`,
      customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
      expiryHours: SNAP_EXPIRY_HOURS,
      finishUrl: `${siteUrl}/invoice/${order.invoiceNo}/installments?pay=finish`,
    });

    if (!snap) {
      return NextResponse.redirect(failUrl);
    }

    await prisma.installmentPayment.update({
      where: { id: payment.id },
      data: {
        snapToken: snap.token,
        paymentUrl: snap.redirectUrl,
        paymentExpiryAt: new Date(Date.now() + SNAP_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    return NextResponse.redirect(snap.redirectUrl);
  } catch (error) {
    console.error('Pay installment error:', error);
    return NextResponse.redirect(installmentsUrl);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string; num: string }> }
) {
  try {
    const { invoiceNo, num } = await params;
    const installmentNumber = parseInt(num);
    const body = await request.json();
    const { paymentProof } = body;

    // Mode online aktif → pembayaran hanya via Midtrans (terkonfirmasi otomatis)
    const gateway = await getPaymentGateway();
    if (gateway === 'midtrans') {
      return NextResponse.json(
        { success: false, error: 'Pembayaran online aktif — silakan gunakan tombol "Bayar Online" pada tabel angsuran.' },
        { status: 400 }
      );
    }

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
