// One-off: sesuaikan penamaan armada di katalog.
// - 'Innova ...' -> 'Inova ...' (tanpa n dobel)
// - 'HiAce ...' -> 'Hiace ...' (a kecil)
// Slug & coverImg TIDAK diubah agar link/riwayat booking tetap jalan.
// Jalankan: node scripts/update-fleet-names.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const FIXES = [
  { from: /Innova/g, to: 'Inova' },
  { from: /HiAce/g, to: 'Hiace' },
];

function fixText(text) {
  let out = text;
  for (const f of FIXES) out = out.replace(f.from, f.to);
  return out;
}

async function main() {
  const tours = await p.tour.findMany({
    where: { category: 'CAR_RENTAL' },
    select: { id: true, slug: true, name: true, itinerary: true },
  });

  let changed = 0;
  for (const tour of tours) {
    const raw = `${tour.name} ${tour.itinerary || ''}`;
    if (!/Innova|HiAce/.test(raw)) continue;

    const newName = fixText(tour.name);
    let newItinerary = tour.itinerary;
    try {
      const items = JSON.parse(newItinerary);
      newItinerary = JSON.stringify(
        items.map((it) => ({
          ...it,
          title: fixText(it.title || ''),
          description: fixText(it.description || ''),
        }))
      );
    } catch {
      newItinerary = fixText(newItinerary);
    }

    const updated = await p.tour.update({
      where: { id: tour.id },
      data: { name: newName, itinerary: newItinerary },
    });
    changed++;
    console.log(`Updated: ${tour.name} -> ${updated.name}`);
  }

  console.log(`Total tour diperbarui: ${changed}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
