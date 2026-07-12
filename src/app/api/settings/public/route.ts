import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, unknown> = {};

    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    // Map to legacy camelCase fields for backward compatibility
    const email = settingsMap['company_email'] || 'info@jelajahnusantara.com';
    const phone = settingsMap['company_phone'] || '+62 812-3456-7890';
    const address = settingsMap['company_address'] || 'Jl. Pariwisata No. 123, Jakarta Selatan';
    const brandName = settingsMap['company_name'] || 'Jelajah Nusantara';
    const brandIcon = settingsMap['company_icon'] || 'JN';

    return NextResponse.json({
      success: true,
      data: {
        ...settingsMap,
        // Legacy camelCase fields for existing components
        email,
        phone,
        address,
        brandName,
        brandIcon,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        email: 'info@jelajahnusantara.com',
        phone: '+62 812-3456-7890',
        address: 'Jl. Pariwisata No. 123, Jakarta Selatan',
        brandName: 'Jelajah Nusantara',
        brandIcon: 'JN',
      },
    });
  }
}
