// Webhook notifikasi pembayaran dari Midtrans.
// Set URL di dashboard Midtrans -> Settings -> Configuration -> Payment Notification URL:
//   https://domain-anda/api/webhooks/midtrans
// Alur: verifikasi signature -> update status order -> kirim notifikasi (email + WhatsApp).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, paymentConfirmationTemplate } from '@/lib/email';
import { notifyCustomerPaymentReceived } from '@/lib/whatsapp';
import { verifyMidtransSignature, mapMidtransState, type MidtransNotificationPayload } from '@/lib/midtrans';

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
        }).catch((err) => console.error('Payment confirmation email failed:', err));

        notifyCustomerPaymentReceived({
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          invoiceNo: order.invoiceNo,
          amountLabel: formatCur(order.total),
        }).catch((err) => console.error('Payment confirmation WA failed:', err));
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
