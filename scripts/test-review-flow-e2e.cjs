// Test E2E alur review (TANPA booking API — buat order langsung di DB).
// 1) Buat order berstatus COMPLETED dengan reviewToken baru.
// 2) Cetak URL review untuk diverifikasi visual di browser.
// 3) Bersihkan dengan: node scripts/cleanup-test-reviews.cjs
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

async function main() {
  const tour = await p.tour.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  });
  if (!tour) {
    console.error('Tidak ada armada aktif di DB.');
    process.exit(1);
  }
  console.log('ARMADA:', tour.name, `(${tour.id})`);

  const ts = Date.now();
  const invoiceNo = `TEST-REV-${ts}`;
  const reviewToken = crypto.randomUUID();
  const tourDate = new Date();
  tourDate.setDate(tourDate.getDate() + 7);

  const order = await p.order.create({
    data: {
      tourId: tour.id,
      invoiceNo,
      customerName: 'Tamu Uji Review',
      customerEmail: 'review-uji@haybalitrans.com',
      customerPhone: '6281200000001',
      tourDate,
      adults: 2,
      children: 0,
      total: 1500000,
      status: 'COMPLETED',
      paymentType: 'FULL',
      paymentMethod: 'manual_transfer',
      paidAt: new Date(),
      reviewToken,
      expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: 'TEST otomatis alur review — boleh dihapus (cleanup-test-reviews.cjs)',
    },
  });

  console.log('ORDER dibuat:', JSON.stringify({ invoiceNo, reviewToken }, null, 1));
  console.log('URL REVIEW:', `http://localhost:3002/review/${reviewToken}`);
  console.log('\nSetelah verifikasi visual, bersihkan dengan: node scripts/cleanup-test-reviews.cjs');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
