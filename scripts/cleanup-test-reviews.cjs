// Bersihkan order test alur review (invoice berawalan TEST-REV-).
// Review ikut terhapus otomatis (Review.order onDelete: Cascade).
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const targets = await p.order.findMany({
    where: { invoiceNo: { startsWith: 'TEST-REV-' } },
    select: { id: true, invoiceNo: true },
  });
  if (targets.length === 0) {
    console.log('Tidak ada order TEST-REV- untuk dibersihkan.');
    return;
  }
  for (const t of targets) {
    await p.order.delete({ where: { id: t.id } });
    console.log('Dihapus:', t.invoiceNo);
  }
  console.log(`Selesai: ${targets.length} order test dibersihkan.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
