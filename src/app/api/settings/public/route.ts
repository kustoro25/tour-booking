import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway, normalizeWaNumber } from '@/lib/settings';
import { WA_NUMBER } from '@/lib/haybali';

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
    const phone = settingsMap['company_phone'] || '+62 851-1933-4511';
    const address = settingsMap['company_address'] || 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361';
    const brandName = settingsMap['company_name'] || 'HAYBALI TRANS';
    const brandIcon = settingsMap['company_icon'] || 'HB';
    // Nomor WhatsApp bisnis (dari pengaturan admin) untuk link wa.me di komponen client
    const whatsappNumber = normalizeWaNumber(String(settingsMap['company_phone'] || '')) || WA_NUMBER;

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
        whatsappNumber,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        paymentGateway: 'manual',
        email: 'info@jelajahnusantara.com',
        phone: '+62 851-1933-4511',
        address: 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361',
        brandName: 'HAYBALI TRANS',
        brandIcon: 'HB',
        whatsappNumber: WA_NUMBER,
      },
    });
  }
}
