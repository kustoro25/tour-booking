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

/** Notifikasi WA aktif hanya jika env terkonfigurasi dan setting tidak dimatikan. */
export async function isWhatsAppEnabled(): Promise<boolean> {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return false;
  const enabled = await getSetting<boolean>('whatsapp_enabled', true);
  return enabled !== false;
}
