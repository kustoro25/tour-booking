// Helper untuk membaca setting dari DB (tabel Setting) dengan fallback ber-tipe.
// Nilai setting disimpan sebagai JSON string (mis. true, "teks", ["a","b"]).

import { prisma } from './prisma';
import { WA_NUMBER } from './haybali';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (!row) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  } catch {
    return fallback;
  }
}

/** Normalisasi nomor HP ke format wa.me (tanpa +, diawali 62). Murni & aman untuk client. */
export function normalizeWaNumber(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/** Nomor WhatsApp bisnis untuk semua link publik (wa.me).
 *  Prioritas: setting admin `company_phone` (kolom "Nomor WhatsApp") > konstanta WA_NUMBER. */
export async function getWhatsAppNumber(): Promise<string> {
  const fromDb = await getSetting<string>('company_phone', '');
  const normalized = normalizeWaNumber(fromDb);
  return normalized || WA_NUMBER;
}

export type PaymentGatewayMode = 'manual' | 'midtrans';

/** Setting DB `payment_gateway` menang atas env PAYMENT_GATEWAY; default manual. */
export async function getPaymentGateway(): Promise<PaymentGatewayMode> {
  const fromDb = await getSetting<string | null>('payment_gateway', null);
  const mode = (fromDb || process.env.PAYMENT_GATEWAY || 'manual').toLowerCase();
  return mode === 'midtrans' ? 'midtrans' : 'manual';
}

/** Email pemilik bisnis untuk notifikasi (pesanan baru & contact form).
 *  Prioritas: env OWNER_EMAIL > setting company_email > env ADMIN_EMAIL. */
export async function getOwnerEmail(): Promise<string> {
  const fromDb = await getSetting<string>('company_email', '');
  const email = process.env.OWNER_EMAIL || fromDb || process.env.ADMIN_EMAIL || 'admin@tourbooking.com';
  return email.trim();
}

/** Notifikasi WA aktif hanya jika env terkonfigurasi dan setting tidak dimatikan. */
export async function isWhatsAppEnabled(): Promise<boolean> {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return false;
  const enabled = await getSetting<boolean>('whatsapp_enabled', true);
  return enabled !== false;
}
