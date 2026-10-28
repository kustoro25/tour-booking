// One-off: sesuaikan katalog armada dengan revisi terbaru.
// - 'Toyota HiAce' -> 'HiAce Premio' (slug tetap, naik ke sortOrder 5)
// - 'Alphard Vellfire' -> dinonaktifkan (digantikan 'HiAce Commuter')
// - Tour baru 'HiAce Commuter' dibuat (slug baru, sortOrder 6)
// - 'Alphard HEV' naik ke sortOrder 4
// Jalankan: node scripts/update-hiace-fleet.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ITINERARY_PREMIO = JSON.stringify([
  { day: 1, title: 'Sewa HiAce Premio + Driver', description: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi). Tarif IDR 1.300.000 / 12 jam. Lembur 10% dari harga per jam. Termasuk pengemudi, bahan bakar, dan air mineral.' },
]);
const ITINERARY_COMMUTER = JSON.stringify([
  { day: 1, title: 'Sewa HiAce Commuter + Driver', description: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi). Tarif IDR 1.300.000 / 12 jam. Lembur 10% dari harga per jam. Termasuk pengemudi, bahan bakar, dan air mineral.' },
]);

async function main() {
  // 1. Toyota HiAce -> HiAce Premio (slug tetap agar link lama tetap jalan)
  const premio = await p.tour.updateMany({
    where: { slug: 'sewa-toyota-hiace-bali' },
    data: { name: 'HiAce Premio', sortOrder: 5, itinerary: ITINERARY_PREMIO },
  });
  console.log('HiAce Premio updated:', premio.count);

  // 2. Alphard HEV naik ke posisi 4
  const hev = await p.tour.updateMany({
    where: { slug: 'sewa-alphard-hev-bali' },
    data: { sortOrder: 4 },
  });
  console.log('Alphard HEV sortOrder:', hev.count);

  // 3. Tour lama Vellfire dinonaktifkan (riwayat booking tetap utuh)
  const retired = await p.tour.updateMany({
    where: { slug: 'sewa-toyota-alphard-bali', category: 'CAR_RENTAL' },
    data: { isActive: false },
  });
  console.log('Alphard Vellfire retired:', retired.count);

  // 4. Tour baru HiAce Commuter
  const commuter = await p.tour.upsert({
    where: { slug: 'sewa-hiace-commuter-bali' },
    update: {},
    create: {
      name: 'HiAce Commuter',
      slug: 'sewa-hiace-commuter-bali',
      category: 'CAR_RENTAL',
      destination: 'Bali',
      duration: '12 Jam',
      priceAdult: 1300000,
      priceChild: 0,
      discount: 0,
      maxSlot: 3,
      minPax: 1,
      itinerary: ITINERARY_COMMUTER,
      includes: JSON.stringify(['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral']),
      excludes: JSON.stringify(['Tiket masuk objek wisata', 'Parkir & tol', 'Area di luar standar (biaya tambahan)']),
      terms: '<p>Harga untuk area standar (Area Kota, Bali Selatan, Bali Tengah). Area di luar standar dikenakan biaya tambahan. Lembur dikenakan 10% dari harga per jam. Jam kerja pengemudi 07.00-23.59.</p>',
      isActive: true,
      sortOrder: 6,
      coverImg: '/images/haybali/hiace-commuter.png',
    },
  });
  console.log('HiAce Commuter upserted:', commuter.slug);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
