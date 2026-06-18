import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [emailSetting, phoneSetting, addressSetting, brandSetting, iconSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'company_email' } }),
      prisma.setting.findUnique({ where: { key: 'company_phone' } }),
      prisma.setting.findUnique({ where: { key: 'company_address' } }),
      prisma.setting.findUnique({ where: { key: 'company_name' } }),
      prisma.setting.findUnique({ where: { key: 'company_icon' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        email: emailSetting ? JSON.parse(emailSetting.value) : 'info@jelajahnusantara.com',
        phone: phoneSetting ? JSON.parse(phoneSetting.value) : '+62 812-3456-7890',
        address: addressSetting ? JSON.parse(addressSetting.value) : 'Jl. Pariwisata No. 123, Jakarta Selatan',
        brandName: brandSetting ? JSON.parse(brandSetting.value) : 'Jelajah Nusantara',
        brandIcon: iconSetting ? JSON.parse(iconSetting.value) : 'JN',
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
