import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAutoUsdRate, getUsdRate, normalizeWaNumber } from '@/lib/settings';
import { WA_NUMBER } from '@/lib/haybali';
import { DEFAULT_USD_RATE } from '@/lib/currency';

// Kurs & pengaturan harus selalu segar setelah admin menyimpan perubahan.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const usdRate = await getUsdRate();
    // Kurs harian (otomatis) untuk pembanding di panel admin saat kurs dikunci.
    const autoUsdRate = await getAutoUsdRate();
    const settingsMap: Record<string, unknown> = {};

    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    // Map to legacy camelCase fields for backward compatibility
    const email = settingsMap['company_email'] || 'Haybalitrans@gmail.com';
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
        // Kurs USD→IDR efektif untuk estimasi harga bahasa English
        usdRate,
        // Kurs harian (tanpa setting manual) sebagai pembanding di panel admin
        autoUsdRate,
        // Legacy camelCase fields for existing components
        email,
        phone,
        address,
        brandName,
        brandIcon,
        brandEmblem,
        whatsappNumber,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        usdRate: DEFAULT_USD_RATE,
        autoUsdRate: DEFAULT_USD_RATE,
        email: 'Haybalitrans@gmail.com',
        phone: '+62 851-1933-4511',
        address: 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361',
        brandName: 'HAYBALI TRANS',
        brandIcon: 'HB',
        brandEmblem: '',
        whatsappNumber: WA_NUMBER,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
