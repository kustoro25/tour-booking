// Membuat (atau memakai ulang) transaksi pembayaran Midtrans Snap,
// lalu redirect customer ke halaman pembayaran Midtrans.
// Dipakai oleh tombol "Bayar Online" di halaman invoice.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway } from '@/lib/settings';
import { createSnapTransaction, isMidtransConfigured } from '@/lib/midtrans';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  const { invoiceNo } = await params;
  const invoiceUrl = new URL(`/invoice/${invoiceNo}`, request.url);

  try {
    if (!isMidtransConfigured()) {
      return NextResponse.redirect(invoiceUrl);
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNo },
      include: { tour: { select: { name: true } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    // Hanya order FULL yang masih PENDING yang bisa dibayar online
    if (order.paymentType !== 'FULL' || order.status !== 'PENDING') {
      return NextResponse.redirect(invoiceUrl);
    }

    const gateway = await getPaymentGateway();
    if (gateway !== 'midtrans') {
      return NextResponse.redirect(invoiceUrl);
    }

    // Pakai transaksi Snap yang sudah ada (order_id Midtrans harus unik per transaksi)
    if (order.paymentUrl) {
      return NextResponse.redirect(order.paymentUrl);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const snap = await createSnapTransaction({
      orderId: order.invoiceNo,
      grossAmount: order.total,
      itemName: order.tour.name,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      expiryHours: 24,
      finishUrl: `${siteUrl}/invoice/${order.invoiceNo}`,
    });

    if (!snap) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat transaksi pembayaran. Silakan coba lagi.' },
        { status: 502 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { snapToken: snap.token, paymentUrl: snap.redirectUrl },
    });

    return NextResponse.redirect(snap.redirectUrl);
  } catch (error) {
    console.error('Pay invoice error:', error);
    return NextResponse.redirect(invoiceUrl);
  }
}
