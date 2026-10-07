import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const paymentGateway = await getPaymentGateway();
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
    const address = settingsMap['company_address'] || 'Denpasar / Kuta, Bali - Indonesia';
    const brandName = settingsMap['company_name'] || 'HAYBALI TRANS';
    const brandIcon = settingsMap['company_icon'] || 'HB';

    return NextResponse.json({
      success: true,
      data: {
        ...settingsMap,
        // Gateway efektif (DB setting → env → default manual)
        paymentGateway,
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
        paymentGateway: 'manual',
        email: 'info@jelajahnusantara.com',
        phone: '+62 812-3456-7890',
        address: 'Denpasar / Kuta, Bali - Indonesia',
        brandName: 'HAYBALI TRANS',
        brandIcon: 'HB',
      },
    });
  }
}
