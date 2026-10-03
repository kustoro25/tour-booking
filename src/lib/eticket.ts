// Pengiriman E-Ticket otomatis ke pelanggan setelah pembayaran LUNAS.
// Dipanggil dari webhook Midtrans, konfirmasi admin, dan konfirmasi angsuran.
// Anti-duplikat: penanda Order.eticketSentAt.

import { prisma } from '@/lib/prisma';
import { sendEmail, eTicketTemplate } from '@/lib/email';
import { getSetting } from '@/lib/settings';
import { parseJsonSafe } from '@/lib/utils';
import type { ItineraryDay } from '@/types';

export async function sendOrderTicketEmail(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tour: true,
        installmentPlan: { select: { status: true } },
      },
    });

    if (!order) {
      console.error('E-ticket: order tidak ditemukan', orderId);
      return false;
    }

    // Sudah pernah dikirim — jangan gandakan
    if (order.eticketSentAt) return false;

    // Hanya kirim saat pembayaran benar-benar lunas:
    // - FULL: order sudah CONFIRMED/COMPLETED
    // - INSTALLMENT: seluruh angsuran terkonfirmasi (plan COMPLETED)
    if (order.paymentType === 'INSTALLMENT') {
      if (order.installmentPlan?.status !== 'COMPLETED') return false;
    } else if (order.status !== 'CONFIRMED' && order.status !== 'COMPLETED') {
      return false;
    }

    const [companyName, companyPhone, companyEmail, companyAddress] = await Promise.all([
      getSetting('company_name', process.env.COMPANY_NAME || 'Jelajah Nusantara Tour'),
      getSetting('company_phone', process.env.COMPANY_PHONE || ''),
      getSetting('company_email', process.env.COMPANY_EMAIL || ''),
      getSetting('company_address', process.env.COMPANY_ADDRESS || ''),
    ]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const sent = await sendEmail({
      to: order.customerEmail,
      subject: `E-Ticket Anda - ${order.tour.name} (${order.invoiceNo})`,
      html: eTicketTemplate({
        customerName: order.customerName,
        invoiceNo: order.invoiceNo,
        tourName: order.tour.name,
        tourDate: new Date(order.tourDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        duration: order.tour.duration,
        destination: order.tour.destination,
        adults: order.adults,
        children: order.children,
        total: `Rp ${order.total.toLocaleString('id-ID')}`,
        itinerary: parseJsonSafe<ItineraryDay[]>(order.tour.itinerary, []),
        includes: parseJsonSafe<string[]>(order.tour.includes, []),
        excludes: parseJsonSafe<string[]>(order.tour.excludes, []),
        companyName,
        companyPhone,
        companyEmail,
        companyAddress,
        invoiceUrl: `${siteUrl}/invoice/${order.invoiceNo}`,
      }),
    });

    if (sent) {
      await prisma.order.update({
        where: { id: order.id },
        data: { eticketSentAt: new Date() },
      });
      console.log(`🎫 E-ticket terkirim untuk ${order.invoiceNo}`);
    }
    return sent;
  } catch (error) {
    console.error('E-ticket email failed:', error);
    return false;
  }
}
