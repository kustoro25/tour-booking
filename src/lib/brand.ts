import { prisma } from '@/lib/prisma';

export async function getBrandName(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'company_name' } });
    if (setting?.value) {
      const name = JSON.parse(setting.value);
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  } catch { /* fallback */ }
  return 'Jelajah Nusantara';
}

export async function getBrandIcon(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'company_icon' } });
    if (setting?.value) {
      const icon = JSON.parse(setting.value);
      if (typeof icon === 'string' && icon.trim()) return icon.trim();
    }
  } catch { /* fallback */ }
  return 'JN';
}
