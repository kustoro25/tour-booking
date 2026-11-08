import { getAllSettings } from '@/lib/settings';

const DEFAULT_TITLE = 'HAYBALI TRANS — Sewa Mobil & Tour Bali';
const DEFAULT_BRAND = 'HAYBALI TRANS';
const DEFAULT_ICON = 'HB';

async function getString(key: string): Promise<string> {
  const map = await getAllSettings();
  const raw = map[key];
  if (!raw) return '';
  try {
    const val = JSON.parse(raw);
    if (typeof val === 'string' && val.trim()) return val.trim();
  } catch { /* fallback */ }
  return '';
}

export async function getSiteTitle(): Promise<string> {
  const title = await getString('site_title');
  return title || DEFAULT_TITLE;
}

export async function getSiteFavicon(): Promise<string> {
  return getString('site_favicon');
}

export async function getBrandName(): Promise<string> {
  const name = await getString('company_name');
  return name || DEFAULT_BRAND;
}

export async function getBrandIcon(): Promise<string> {
  const icon = await getString('company_icon');
  return icon || DEFAULT_ICON;
}
