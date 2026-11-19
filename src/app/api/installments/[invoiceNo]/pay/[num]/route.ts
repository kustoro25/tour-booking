// Pembayaran angsuran (mode transfer manual):
// - POST : unggah bukti transfer untuk satu angsuran (0 = DP).
//   Status berubah menjadi PAID ("Menunggu Konfirmasi") — admin memverifikasi
//   bukti lalu mengonfirmasi secara manual dari panel admin.
//   Admin mendapat notifikasi email setiap kali bukti transfer diunggah.

import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, installmentProofUploadedTemplate } from '@/lib/email';
import { getOwnerEmail } from '@/lib/settings';

// Notifikasi pasca-response dijalankan via after() agar serverless tetap
// mengerjakannya sampai selesai (waitUntil), tidak dibekukan setelah response.
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string; num: string }> }
) {
  try {
    const { invoiceNo, num } = await params;
    const installmentNumber = parseInt(num);
    const body = await request.json();
    const { paymentProof } = body;

    if (!Number.isInteger(installmentNumber) || installmentNumber < 0) {
      return NextResponse.json({ success: false, error: 'Nomor angsuran tidak valid' }, { status: 400 });
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

    // Update payment proof and status → menunggu konfirmasi admin
    await prisma.installmentPayment.update({
      where: { id: payment.id },
      data: {
        paymentProof,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Notifikasi email ke admin: bukti transfer baru perlu diverifikasi
    const label = installmentNumber === 0 ? 'DP (Uang Muka)' : `Angsuran ke-${installmentNumber}`;
    after(() =>
      (async () => {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const companyName = process.env.COMPANY_NAME || 'HAYBALI TRANS';
          const adminEmail = await getOwnerEmail();
          await sendEmail({
            to: adminEmail,
            subject: `Bukti Transfer Baru: ${invoiceNo} - ${label}`,
            html: installmentProofUploadedTemplate({
              customerName: order.customerName,
              invoiceNo,
              paymentLabel: label,
              amountLabel: `Rp ${payment.amount.toLocaleString('id-ID')}`,
              proofUrl: paymentProof,
              adminUrl: `${siteUrl}/admin/installments/${plan.id}`,
              companyName,
            }),
          });
        } catch (err) {
          console.error('Failed to send admin proof notification:', err);
        }
      })()
    );

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil diunggah. Menunggu konfirmasi admin.',
    });
  } catch (error) {
    console.error('Upload installment proof error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
