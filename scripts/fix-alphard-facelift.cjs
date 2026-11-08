// One-off: perbaiki penamaan katalog 'ALPHARD VACHELIFT' -> 'ALPHARD FACELIFT'.
// Slug & coverImg TIDAK diubah agar link/riwayat booking tetap jalan.
// Jalankan: node scripts/fix-alphard-facelift.cjs [--dry]
require('dotenv').config({ path: ['.env.local', '.env'] });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const FROM = /vachelift/gi;
const TO = 'FACELIFT';
const DRY = process.argv.includes('--dry');

const fixText = (text) => (typeof text === 'string' ? text.replace(FROM, TO) : text);

async function main() {
  const tours = await p.tour.findMany({
    where: { category: 'CAR_RENTAL' },
    select: { id: true, slug: true, name: true, itinerary: true, includes: true, excludes: true, terms: true },
  });

  let changed = 0;
  for (const tour of tours) {
    const name = fixText(tour.name);
    const itinerary = fixText(tour.itinerary);
    const includes = fixText(tour.includes);
    const excludes = fixText(tour.excludes);
    const terms = fixText(tour.terms);

    const unchanged =
      name === tour.name &&
      itinerary === tour.itinerary &&
      includes === tour.includes &&
      excludes === tour.excludes &&
      terms === tour.terms;
    if (unchanged) continue;

    if (DRY) {
      console.log(`[dry] ${tour.slug}: "${tour.name}" -> "${name}"`);
    } else {
      await p.tour.update({
        where: { id: tour.id },
        data: { name, itinerary, includes, excludes, terms },
      });
      console.log(`Updated: ${tour.slug}: "${tour.name}" -> "${name}"`);
    }
    changed++;
  }

  console.log(`${DRY ? 'Perlu diubah' : 'Total diperbarui'}: ${changed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
