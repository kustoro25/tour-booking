// One-off: tambahkan armada Alphard Vachelift (LUX) ke katalog sewa mobil.
// Sekaligus geser sortOrder Hiace Premio (5 -> 6) dan Hiace Commuter (6 -> 7)
// agar urutan konsisten dengan daftar FLEET di src/lib/haybali.ts (homepage).
// Jalankan: node scripts/add-vachelift-fleet.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const NEW_FLEET = {
  name: 'Alphard Vachelift (LUX)',
  slug: 'sewa-alphard-vachelift-bali',
  category: 'CAR_RENTAL',
  destination: 'Bali',
  duration: '6 / 12 Jam',
  priceAdult: 2300000,
  priceChild: 0,
  discount: 0,
  maxSlot: 3,
  minPax: 1,
  itinerary: JSON.stringify([
    { day: 1, title: 'Sewa Alphard Vachelift + Driver', description: 'Direkomendasikan untuk 4 penumpang (maksimum 5 tanpa bagasi). Tarif IDR 1.400.000 / 6 jam dan IDR 2.300.000 / 12 jam. Lembur 10% dari harga per jam. Termasuk pengemudi, bahan bakar, dan air mineral.' },
  ]),
  includes: JSON.stringify(['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral']),
  excludes: JSON.stringify(['Tiket masuk objek wisata', 'Parkir & tol', 'Area di luar standar (biaya tambahan)']),
  terms: '<p>Harga untuk area standar (Area Kota, Bali Selatan, Bali Tengah). Area di luar standar dikenakan biaya tambahan. Lembur dikenakan 10% dari harga per jam. Jam kerja pengemudi 07.00-23.59.</p>',
  isActive: true,
  sortOrder: 5,
  coverImg: '/images/haybali/alphard-vachelift.jpg',
};

const SORT_SHIFTS = [
  { slug: 'sewa-toyota-hiace-bali', to: 6 },
  { slug: 'sewa-hiace-commuter-bali', to: 7 },
];

async function main() {
  const existing = await p.tour.findUnique({ where: { slug: NEW_FLEET.slug } });
  if (existing) {
    const updated = await p.tour.update({ where: { slug: NEW_FLEET.slug }, data: NEW_FLEET });
    console.log('Armada diperbarui:', updated.name, '(sortOrder', updated.sortOrder + ')');
  } else {
    const created = await p.tour.create({ data: NEW_FLEET });
    console.log('Armada dibuat:', created.name, '(sortOrder', created.sortOrder + ')');
  }

  for (const shift of SORT_SHIFTS) {
    const res = await p.tour.updateMany({
      where: { slug: shift.slug, category: 'CAR_RENTAL' },
      data: { sortOrder: shift.to },
    });
    console.log(`sortOrder ${shift.slug} -> ${shift.to} (${res.count} row)`);
  }

  const fleet = await p.tour.findMany({
    where: { isActive: true, category: 'CAR_RENTAL' },
    orderBy: { sortOrder: 'asc' },
    select: { sortOrder: true, name: true, slug: true },
  });
  console.log('\nKatalog armada aktif saat ini:');
  for (const t of fleet) console.log(`  ${t.sortOrder}. ${t.name} (${t.slug})`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
