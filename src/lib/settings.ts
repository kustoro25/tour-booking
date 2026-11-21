// Helper untuk membaca setting dari DB (tabel Setting) dengan fallback ber-tipe.
// Nilai setting disimpan sebagai JSON string (mis. true, "teks", ["a","b"]).

import { cache } from 'react';
import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import { WA_NUMBER } from './haybali';
import { DEFAULT_USD_RATE } from './currency';

/** Tag cache untuk seluruh baris tabel Setting. Dipakai halaman admin agar
 *  perubahan pengaturan langsung tampil tanpa menunggu masa revalidate. */
export const SETTINGS_CACHE_TAG = 'site-settings';

/**
 * Semua setting dibaca sekali (1 query) lalu di-cache:
 * - `cache()` → dedupe per request, jadi layout + page tidak menembak DB berkali-kali.
 * - `unstable_cache()` → simpan 5 menit di data cache Next.js (hemat round-trip ke Neon).
 */
const loadSettingsMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const rows = await prisma.setting.findMany({ select: { key: true, value: true } });
      const map: Record<string, string> = {};
      for (const row of rows) map[row.key] = row.value;
      return map;
    } catch {
      return {};
    }
  },
  ['settings-map-v1'],
  { revalidate: 300, tags: [SETTINGS_CACHE_TAG] }
);

const settingsMap = cache(() => loadSettingsMap());

function parseRaw<T>(raw: string | undefined, fallback: T): T {
  if (raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/** Salinan mentah semua setting (sudah di-cache). */
export async function getAllSettings(): Promise<Record<string, string>> {
  return settingsMap();
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const map = await settingsMap();
  return parseRaw(map[key], fallback);
}

/** Panggil setelah admin menyimpan setting agar cache publik ikut diperbarui. */
export function invalidateSettingsCache(): void {
  revalidateTag(SETTINGS_CACHE_TAG, 'max');
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

/** Nama brand aktif untuk email & notifikasi.
 *  Prioritas: setting admin `company_name` (DB) > env COMPANY_NAME > 'HAYBALI TRANS'.
 *  Dipakai supaya email selalu memakai nama brand terkini dari panel admin,
 *  bukan nama lama yang masih tersimpan di environment variable. */
export async function getCompanyName(): Promise<string> {
  const fromDb = await getSetting<string>('company_name', '');
  return (fromDb || process.env.COMPANY_NAME || 'HAYBALI TRANS').trim();
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

/** Kurs live USD→IDR dari API publik; di-cache 6 jam agar tidak spam sumber. */
const fetchLiveUsdRate = unstable_cache(
  async (): Promise<number | null> => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rate = Number(data?.rates?.IDR);
      return Number.isFinite(rate) && rate > 1000 ? Math.round(rate) : null;
    } catch {
      return null;
    }
  },
  ['usd-idr-live-rate-v1'],
  { revalidate: 21600 }
);

/** Kurs manual dari panel admin. Dibaca langsung dari DB (tanpa cache 5 menit)
 *  supaya angka yang baru disimpan langsung terpakai di halaman publik. */
async function getManualUsdRate(): Promise<number | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'usd_rate' }, select: { value: true } });
    if (!row) return null;
    let parsed: unknown = row.value;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      // nilai tersimpan sebagai teks mentah
    }
    const rate = Number(parsed);
    return Number.isFinite(rate) && rate > 1000 ? Math.round(rate) : null;
  } catch {
    return null;
  }
}

/** Kurs otomatis (live → env → konstanta cadangan), mengabaikan setting manual.
 *  Dipakai panel admin sebagai pembanding "kurs harian" sebelum mengunci kurs. */
export async function getAutoUsdRate(): Promise<number> {
  const live = await fetchLiveUsdRate();
  if (live) return live;

  const envRate = Number(process.env.USD_IDR_RATE);
  if (Number.isFinite(envRate) && envRate > 1000) return Math.round(envRate);

  return DEFAULT_USD_RATE;
}

/** Kurs USD→IDR efektif. Prioritas: setting admin `usd_rate` (manual) >
 *  kurs live (cache 6 jam) > env USD_IDR_RATE > konstanta cadangan. */
export async function getUsdRate(): Promise<number> {
  const manual = await getManualUsdRate();
  if (manual) return manual;
  return getAutoUsdRate();
}
