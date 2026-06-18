import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [emailSetting, phoneSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'company_email' } }),
      prisma.setting.findUnique({ where: { key: 'company_phone' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        email: emailSetting ? JSON.parse(emailSetting.value) : 'info@jelajahnusantara.com',
        phone: phoneSetting ? JSON.parse(phoneSetting.value) : '+62 812-3456-7890',
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        email: 'info@jelajahnusantara.com',
        phone: '+62 812-3456-7890',
      },
    });
  }
}
