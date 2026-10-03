// Notifikasi WhatsApp via Meta Cloud API
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// Semua pesan keluar menggunakan template yang sudah di-approve Meta
// (kategori Utility). Jika env belum diisi atau setting whatsapp_enabled=false,
// pengiriman dilewati dengan aman (tidak melempar error).

import { isWhatsAppEnabled } from './settings';

const GRAPH_VERSION = 'v22.0';

// Parameter template (harus sama persis dengan yang di-submit ke Meta):
// - konfirmasi_booking:  {{1}} nama  {{2}} paket  {{3}} tanggal tour  {{4}} invoice  {{5}} total  {{6}} batas pembayaran
// - pembayaran_diterima: {{1}} nama  {{2}} invoice  {{3}} jumlah
// - pesanan_baru:        {{1}} nama  {{2}} no HP  {{3}} paket  {{4}} tanggal tour  {{5}} total  {{6}} invoice
export const WA_TEMPLATES = {
  bookingConfirmation: 'konfirmasi_booking',
  paymentReceived: 'pembayaran_diterima',
  adminNewOrder: 'pesanan_baru',
} as const;

/** Normalisasi nomor HP Indonesia ke format internasional tanpa + (mis. 0812... -> 62812...). */
export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/** Meta menolak parameter kosong, baris baru, atau > 1024 karakter. */
function sanitizeParam(value: string): string {
  const s = String(value ?? '')
    .replace(/[\n\r\t]+/g, ' ')
    .trim();
  return (s || '-').slice(0, 1000);
}

async function sendTemplate(to: string, templateName: string, bodyParams: string[]): Promise<boolean> {
  const phone = normalizePhone(to);
  if (!phone) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'id' },
            components: bodyParams.length
              ? [
                  {
                    type: 'body',
                    parameters: bodyParams.map((t) => ({ type: 'text', text: sanitizeParam(t) })),
                  },
                ]
              : [],
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error(`WhatsApp send failed (${templateName} -> ${phone}):`, res.status, err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

/** Pengirim generik — mematuhi setting whatsapp_enabled & konfigurasi env. */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: string[]
): Promise<boolean> {
  if (!(await isWhatsAppEnabled())) return false;
  return sendTemplate(to, templateName, bodyParams);
}

export interface BookingNotificationData {
  customerName: string;
  customerPhone: string;
  tourName: string;
  tourDateLabel: string;
  invoiceNo: string;
  totalLabel: string;
  expiryLabel: string;
}

export async function notifyCustomerNewBooking(info: BookingNotificationData): Promise<boolean> {
  return sendWhatsAppTemplate(info.customerPhone, WA_TEMPLATES.bookingConfirmation, [
    info.customerName,
    info.tourName,
    info.tourDateLabel,
    info.invoiceNo,
    info.totalLabel,
    info.expiryLabel,
  ]);
}

export async function notifyCustomerPaymentReceived(info: {
  customerPhone: string;
  customerName: string;
  invoiceNo: string;
  amountLabel: string;
}): Promise<boolean> {
  return sendWhatsAppTemplate(info.customerPhone, WA_TEMPLATES.paymentReceived, [
    info.customerName,
    info.invoiceNo,
    info.amountLabel,
  ]);
}

export async function notifyAdminNewOrder(info: BookingNotificationData): Promise<boolean> {
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '';
  if (!adminNumber) return false;
  return sendWhatsAppTemplate(adminNumber, WA_TEMPLATES.adminNewOrder, [
    info.customerName,
    info.customerPhone,
    info.tourName,
    info.tourDateLabel,
    info.totalLabel,
    info.invoiceNo,
  ]);
}
