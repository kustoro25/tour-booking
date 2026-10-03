// Bersihkan order test (CUI pengujian sandbox).
// Kriteria: notes mengandung "boleh dihapus" DAN email customer test.
// Kuota slot dikembalikan untuk order yang masih berstatus PENDING/CONFIRMED.
//
// Jalankan: node scripts/cleanup-test-orders.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const TEST_EMAIL = 'kustoroterbatas@gmail.com';

async function main() {
  const orders = await p.order.findMany({
    where: {
      notes: { contains: 'boleh dihapus' },
      customerEmail: TEST_EMAIL,
    },
  });

  if (orders.length === 0) {
    console.log('Tidak ada order test yang cocok. Tidak ada yang dihapus.');
    return;
  }

  console.log(`Ditemukan ${orders.length} order test:`);
  for (const o of orders) {
    console.log(`  - ${o.invoiceNo} [${o.status}] ${o.customerName} (Rp ${o.total.toLocaleString('id-ID')})`);
  }

  for (const o of orders) {
    await p.$transaction(async (tx) => {
      // Kembalikan kuota slot jika order masih memegangnya
      if (o.status === 'PENDING' || o.status === 'CONFIRMED') {
        const slot = await tx.tourSlot.findUnique({
          where: { tourId_date: { tourId: o.tourId, date: o.tourDate } },
        });
        if (slot) {
          const pax = o.adults + o.children;
          await tx.tourSlot.update({
            where: { id: slot.id },
            data: { bookedCount: Math.max(0, slot.bookedCount - pax) },
          });
          console.log(`  -> slot ${slot.date.toISOString().slice(0, 10)} kuota dikurangi ${pax}`);
        }
      }

      // Hapus data terkait lalu order
      const plan = await tx.installmentPlan.findUnique({ where: { orderId: o.id } });
      if (plan) {
        await tx.installmentPayment.deleteMany({ where: { planId: plan.id } });
        await tx.installmentPlan.delete({ where: { id: plan.id } });
      }
      await tx.invoice.deleteMany({ where: { orderId: o.id } });
      await tx.order.delete({ where: { id: o.id } });
      console.log(`  -> ${o.invoiceNo} dihapus`);
    });
  }

  console.log(`\nSelesai. ${orders.length} order test dihapus, kuota slot dikembalikan.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
