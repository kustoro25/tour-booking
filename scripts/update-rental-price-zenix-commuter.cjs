// One-off: penyesuaian harga armada sewa mobil.
// - Inova Zenix Q (LUX): tarif 12 jam Rp 1.800.000 -> Rp 1.600.000 (6 jam tetap Rp 1.400.000)
// - Hiace Commuter: tambah tarif 6 jam Rp 1.000.000 (12 jam tetap Rp 1.300.000)
// Jalankan: node scripts/update-rental-price-zenix-commuter.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ITINERARY_ZENIX_Q = JSON.stringify([
  { day: 1, title: 'Sewa Inova Zenix Q + Driver', description: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi). Tarif IDR 1.400.000 / 6 jam dan IDR 1.600.000 / 12 jam. Lembur 10% dari harga per jam. Termasuk pengemudi, bahan bakar, dan air mineral.' },
]);
const ITINERARY_COMMUTER = JSON.stringify([
  { day: 1, title: 'Sewa Hiace Commuter + Driver', description: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi). Tarif IDR 1.000.000 / 6 jam dan IDR 1.300.000 / 12 jam. Lembur 10% dari harga per jam. Termasuk pengemudi, bahan bakar, dan air mineral.' },
]);

async function main() {
  // 1. Inova Zenix Q: harga 12 jam turun ke 1.600.000
  const zenix = await p.tour.updateMany({
    where: { slug: 'sewa-innova-zenix-bali' },
    data: { priceAdult: 1600000, duration: '6 / 12 Jam', itinerary: ITINERARY_ZENIX_Q },
  });
  console.log('Inova Zenix Q updated:', zenix.count);

  // 2. Hiace Commuter: kini melayani 6 jam & 12 jam
  const commuter = await p.tour.updateMany({
    where: { slug: 'sewa-hiace-commuter-bali' },
    data: { duration: '6 / 12 Jam', itinerary: ITINERARY_COMMUTER },
  });
  console.log('Hiace Commuter updated:', commuter.count);

  const rows = await p.tour.findMany({
    where: { slug: { in: ['sewa-innova-zenix-bali', 'sewa-hiace-commuter-bali'] } },
    select: { name: true, slug: true, duration: true, priceAdult: true },
  });
  console.log('VERIFY:', JSON.stringify(rows, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
