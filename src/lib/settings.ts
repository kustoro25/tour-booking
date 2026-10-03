// Helper untuk membaca setting dari DB (tabel Setting) dengan fallback ber-tipe.
// Nilai setting disimpan sebagai JSON string (mis. true, "teks", ["a","b"]).

import { prisma } from './prisma';

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
