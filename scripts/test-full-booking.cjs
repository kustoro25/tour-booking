// Buat booking test FULL PAYMENT via API + tampilkan state dari DB.
// Jalankan (dev server harus hidup): node scripts/test-full-booking.cjs [tourDate]
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const BASE = 'http://localhost:3000';
const TOUR_ID = 'cmqinvk6c000514oc2tw1ymdf'; // 2D1N Bromo Sunrise (900k/adult, maxSlot 30)
const TOUR_DATE = process.argv[2] || '2026-10-21';

async function main() {
  const tour = await p.tour.findFirst({
    where: { id: TOUR_ID },
    select: { id: true, name: true, slug: true, minPax: true, priceAdult: true },
  });
  console.log('TOUR:', JSON.stringify(tour));

  const payload = {
    tourId: tour.id,
    tourDate: TOUR_DATE,
    customerName: 'Test E-Ticket Otomatis',
    customerEmail: 'kustoroterbatas@gmail.com',
    customerPhone: '6281234567890',
    adults: 5,
    children: 0,
    notes: 'TEST otomatis e-ticket — boleh dihapus',
    paymentType: 'FULL',
  };

  const res = await fetch(`${BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log('HTTP_STATUS:', res.status);
  const data = await res.json();
  console.log('RESPONSE:', JSON.stringify(data, null, 1));

  if (!data.success) return;

  const invoiceNo = data.data.invoiceNo;
  const order = await p.order.findUnique({ where: { invoiceNo } });
  console.log('ORDER:', JSON.stringify({
    invoiceNo: order.invoiceNo,
    status: order.status,
    paymentType: order.paymentType,
    total: order.total,
    eticketSentAt: order.eticketSentAt,
    paymentUrl: order.paymentUrl ? order.paymentUrl.slice(0, 70) + '...' : null,
    snapToken: order.snapToken ? '(ada)' : null,
    expiryAt: order.expiryAt.toISOString(),
  }, null, 1));

  const slot = await p.tourSlot.findUnique({
    where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
  });
  console.log('SLOT:', JSON.stringify({ date: slot.date.toISOString().slice(0, 10), bookedCount: slot.bookedCount, quota: slot.quota }));
  console.log(`\nLANGKAH BERIKUTNYA: node scripts/simulate-webhook.cjs ${invoiceNo} ${order.total}.00 settlement`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
