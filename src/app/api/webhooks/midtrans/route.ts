// Webhook notifikasi pembayaran dari Midtrans.
// Set URL di dashboard Midtrans -> Settings -> Configuration -> Payment Notification URL:
//   https://domain-anda/api/webhooks/midtrans
// Alur: verifikasi signature -> update status order/angsuran -> kirim notifikasi (email + WhatsApp).
// Pola order_id: {invoiceNo} = pembayaran lunas; {invoiceNo}-INST-{n} = pembayaran angsuran (0 = DP).

import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, paymentConfirmationTemplate, installmentConfirmationTemplate } from '@/lib/email';
import { sendOrderTicketEmail } from '@/lib/eticket';
import { notifyCustomerPaymentReceived } from '@/lib/whatsapp';
import { verifyMidtransSignature, mapMidtransState, type MidtransNotificationPayload } from '@/lib/midtrans';

// Notifikasi pasca-response (email/WA/e-ticket) dijalankan via after() agar
// serverless tetap mengerjakannya sampai selesai (waitUntil), tidak dibekukan.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let payload: MidtransNotificationPayload;
    try {
      payload = (await request.json()) as MidtransNotificationPayload;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!verifyMidtransSignature(payload)) {
      console.error('Midtrans webhook: signature tidak valid untuk order', payload?.order_id);
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    // Notifikasi pembayaran angsuran: order_id = {invoiceNo}-INST-{n}
    const instMatch = /^(.+)-INST-(\d+)$/.exec(payload.order_id || '');
    if (instMatch) {
      return await handleInstallmentPayment(payload, instMatch[1], parseInt(instMatch[2], 10));
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNo: payload.order_id },
      include: { tour: { select: { name: true } } },
    });

    if (!order) {
      console.error('Midtrans webhook: order tidak ditemukan', payload.order_id);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const state = mapMidtransState(payload.transaction_status, payload.fraud_status);

    if (state === 'paid') {
      const needsConfirmation = order.status === 'PENDING' || order.status === 'CANCELLED';

      if (needsConfirmation) {
        const wasCancelled = order.status === 'CANCELLED';

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CONFIRMED',
            paymentMethod: payload.payment_type || 'MIDTRANS',
            paymentRef: payload.transaction_id || null,
            paidAt: new Date(),
          },
        });

        // Kembalikan kuota slot jika order sempat dibatalkan (pembayaran telat masuk)
        if (wasCancelled) {
          const slot = await prisma.tourSlot.findUnique({
            where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
          });
          if (slot) {
            const totalPax = order.adults + order.children;
            await prisma.tourSlot.update({
              where: { id: slot.id },
              data: { bookedCount: slot.bookedCount + totalPax },
            });
          }
        }

        // Notifikasi ke pembeli (email + WhatsApp) — non-blocking
        const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
        const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

        after(() =>
          sendEmail({
            to: order.customerEmail,
            subject: `Pembayaran Dikonfirmasi - ${order.tour.name}`,
            html: paymentConfirmationTemplate({
              customerName: order.customerName,
              tourName: order.tour.name,
              invoiceNo: order.invoiceNo,
              tourDate: new Date(order.tourDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              companyName,
            }),
          }).catch((err) => console.error('Payment confirmation email failed:', err))
        );

        // E-Ticket otomatis (anti-duplikat via eticketSentAt)
        after(() => sendOrderTicketEmail(order.id).catch((err) => console.error('E-ticket email failed:', err)));

        after(() =>
          notifyCustomerPaymentReceived({
            customerPhone: order.customerPhone,
            customerName: order.customerName,
            invoiceNo: order.invoiceNo,
            amountLabel: formatCur(order.total),
          }).catch((err) => console.error('Payment confirmation WA failed:', err))
        );
      } else {
        // Order sudah CONFIRMED/COMPLETED — cukup simpan referensi transaksi terbaru
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentRef: payload.transaction_id || order.paymentRef,
            paymentMethod: payload.payment_type || order.paymentMethod,
          },
        });
      }
    } else if (state === 'failed' || state === 'expired') {
      // Batalkan hanya jika order masih menunggu pembayaran
      if (order.status === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        // Lepaskan kuota slot
        const slot = await prisma.tourSlot.findUnique({
          where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
        });
        if (slot) {
          const totalPax = order.adults + order.children;
          await prisma.tourSlot.update({
            where: { id: slot.id },
            data: { bookedCount: Math.max(0, slot.bookedCount - totalPax) },
          });
        }
      }
    } else {
      // pending / refunded / unknown — catat saja
      console.log('Midtrans webhook: status', payload.transaction_status, 'untuk', payload.order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Pembayaran satu tahap angsuran (DP atau angsuran ke-n) terkonfirmasi:
 * update record angsuran -> notifikasi -> kelola status pesanan & plan.
 */
async function handleInstallmentPayment(
  payload: MidtransNotificationPayload,
  invoiceNo: string,
  installmentNumber: number
): Promise<NextResponse> {
  const order = await prisma.order.findUnique({
    where: { invoiceNo },
    include: {
      tour: { select: { name: true } },
      installmentPlan: { include: { payments: { orderBy: { installmentNumber: 'asc' } } } },
    },
  });

  if (!order || !order.installmentPlan) {
    console.error('Midtrans webhook: pesanan angsuran tidak ditemukan', payload.order_id);
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const plan = order.installmentPlan;
  const payment = plan.payments.find((p) => p.installmentNumber === installmentNumber);
  if (!payment) {
    console.error('Midtrans webhook: angsuran tidak ditemukan', payload.order_id);
    return NextResponse.json({ success: false, error: 'Installment not found' }, { status: 404 });
  }

  const state = mapMidtransState(payload.transaction_status, payload.fraud_status);

  if (state !== 'paid') {
    // pending / failed / expired / refunded — cukup catat, pelanggan dapat mencoba lagi
    console.log('Midtrans webhook: pembayaran angsuran', payload.transaction_status, 'untuk', payload.order_id);
    return NextResponse.json({ success: true });
  }

  // Idempotent — notifikasi ulang tidak memproses ganda
  if (payment.status === 'CONFIRMED') {
    return NextResponse.json({ success: true });
  }

  const now = new Date();
  await prisma.installmentPayment.update({
    where: { id: payment.id },
    data: {
      status: 'CONFIRMED',
      paymentMethod: payload.payment_type || 'MIDTRANS',
      paymentRef: payload.transaction_id || null,
      paidAt: now,
      adminConfirmedBy: 'Midtrans (otomatis)',
      adminConfirmedAt: now,
    },
  });

  const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
  const formatCur = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  if (installmentNumber === 0) {
    // DP diterima → aktifkan pesanan (setara pembayaran lunas pada order FULL)
    const needsConfirmation = order.status === 'PENDING' || order.status === 'CANCELLED';
    const wasCancelled = order.status === 'CANCELLED';

    if (needsConfirmation) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentMethod: payload.payment_type || 'MIDTRANS',
          paymentRef: payload.transaction_id || null,
          paidAt: now,
        },
      });

      // Kembalikan kuota slot jika pesanan sempat dibatalkan (DP telat masuk)
      if (wasCancelled) {
        const slot = await prisma.tourSlot.findUnique({
          where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
        });
        if (slot) {
          const totalPax = order.adults + order.children;
          await prisma.tourSlot.update({
            where: { id: slot.id },
            data: { bookedCount: slot.bookedCount + totalPax },
          });
        }
      }
    }

    const remaining = plan.payments.filter((p) => p.id !== payment.id && p.status !== 'CONFIRMED').length;
    const nextPayment = plan.payments.find((p) => p.id !== payment.id && p.status !== 'CONFIRMED');

    after(() =>
      sendEmail({
        to: order.customerEmail,
        subject: `DP Diterima — Pesanan ${order.invoiceNo} Aktif`,
        html: installmentConfirmationTemplate({
          customerName: order.customerName,
          tourName: order.tour.name,
          invoiceNo: order.invoiceNo,
          installmentNumber: 0,
          amount: formatCur(payment.amount),
          remainingInstallments: remaining,
          nextDueDate: nextPayment
            ? new Date(nextPayment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : '-',
          companyName,
        }),
      }).catch((err) => console.error('DP confirmation email failed:', err))
    );
  } else {
    // Angsuran ke-n diterima → notifikasi konfirmasi
    const remaining = plan.payments.filter((p) => p.id !== payment.id && p.status !== 'CONFIRMED').length;
    const nextPayment = plan.payments.find((p) => p.id !== payment.id && p.status !== 'CONFIRMED');

    after(() =>
      sendEmail({
        to: order.customerEmail,
        subject: `Pembayaran Angsuran ke-${installmentNumber} Dikonfirmasi - ${order.tour.name}`,
        html: installmentConfirmationTemplate({
          customerName: order.customerName,
          tourName: order.tour.name,
          invoiceNo: order.invoiceNo,
          installmentNumber,
          amount: formatCur(payment.amount),
          remainingInstallments: remaining,
          nextDueDate: nextPayment
            ? new Date(nextPayment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : '-',
          companyName,
        }),
      }).catch((err) => console.error('Installment confirmation email failed:', err))
    );
  }

  after(() =>
    notifyCustomerPaymentReceived({
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      invoiceNo: order.invoiceNo,
      amountLabel: `${installmentNumber === 0 ? 'DP ' : `Angsuran ke-${installmentNumber} `}${formatCur(payment.amount)}`,
    }).catch((err) => console.error('Payment confirmation WA failed:', err))
  );

  // Semua pembayaran (DP + seluruh angsuran) terkonfirmasi → plan LUNAS
  const allPayments = await prisma.installmentPayment.findMany({ where: { planId: plan.id } });
  if (allPayments.length > 0 && allPayments.every((p) => p.status === 'CONFIRMED')) {
    await prisma.installmentPlan.update({
      where: { id: plan.id },
      data: { status: 'COMPLETED' },
    });

    // Seluruh angsuran lunas → kirim E-Ticket otomatis
    after(() => sendOrderTicketEmail(order.id).catch((err) => console.error('E-ticket email failed:', err)));
  }

  return NextResponse.json({ success: true });
}
