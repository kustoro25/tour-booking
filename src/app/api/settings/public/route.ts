import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway, getUsdRate, normalizeWaNumber } from '@/lib/settings';
import { WA_NUMBER } from '@/lib/haybali';
import { DEFAULT_USD_RATE } from '@/lib/currency';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const paymentGateway = await getPaymentGateway();
    const usdRate = await getUsdRate();
    const settingsMap: Record<string, unknown> = {};

    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    // Map to legacy camelCase fields for backward compatibility
    const email = settingsMap['company_email'] || 'info@haybalitrans.com';
    const phone = settingsMap['company_phone'] || '+62 851-1933-4511';
    const address = settingsMap['company_address'] || 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361';
    const brandName = settingsMap['company_name'] || 'HAYBALI TRANS';
    const brandIcon = settingsMap['company_icon'] || 'HB';
    // Emblem = logo mark tanpa teks untuk navbar/footer di samping nama brand.
    const brandEmblem = settingsMap['company_emblem'] || '';
    // Nomor WhatsApp bisnis (dari pengaturan admin) untuk link wa.me di komponen client
    const whatsappNumber = normalizeWaNumber(String(settingsMap['company_phone'] || '')) || WA_NUMBER;

    return NextResponse.json({
      success: true,
      data: {
        ...settingsMap,
        // Gateway efektif (DB setting → env → default manual)
        paymentGateway,
        // Kurs USD→IDR efektif untuk estimasi harga bahasa English
        usdRate,
        // Legacy camelCase fields for existing components
        email,
        phone,
        address,
        brandName,
        brandIcon,
        brandEmblem,
        whatsappNumber,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        paymentGateway: 'manual',
        usdRate: DEFAULT_USD_RATE,
        email: 'info@haybalitrans.com',
        phone: '+62 851-1933-4511',
        address: 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361',
        brandName: 'HAYBALI TRANS',
        brandIcon: 'HB',
        brandEmblem: '',
        whatsappNumber: WA_NUMBER,
      },
    });
  }
}
