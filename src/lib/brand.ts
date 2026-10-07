import { prisma } from '@/lib/prisma';

const DEFAULT_TITLE = 'HAYBALI TRANS — Sewa Mobil & Tour Bali';
const DEFAULT_BRAND = 'HAYBALI TRANS';
const DEFAULT_ICON = 'HB';

async function getSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (setting?.value) {
      const val = JSON.parse(setting.value);
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
  } catch { /* fallback */ }
  return '';
}

export async function getSiteTitle(): Promise<string> {
  const title = await getSetting('site_title');
  return title || DEFAULT_TITLE;
}

export async function getSiteFavicon(): Promise<string> {
  return getSetting('site_favicon');
}

export async function getBrandName(): Promise<string> {
  const name = await getSetting('company_name');
  return name || DEFAULT_BRAND;
}

export async function getBrandIcon(): Promise<string> {
  const icon = await getSetting('company_icon');
  return icon || DEFAULT_ICON;
}
