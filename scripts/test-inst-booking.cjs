// Buat booking test INSTALLMENT via API + tampilkan state DP/plan dari DB.
// Jalankan (dev server harus hidup): node scripts/test-inst-booking.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const BASE = 'http://localhost:3000';
const TOUR_ID = 'cmqinvk6c000514oc2tw1ymdf'; // 2D1N Bromo Sunrise (900k/adult, maxSlot 30)
const TOUR_DATE = process.argv[2] || '2026-10-15';

async function main() {
  const tour = await p.tour.findFirst({
    where: { id: TOUR_ID },
    select: { id: true, name: true, slug: true, minPax: true },
  });
  console.log('TOUR:', JSON.stringify(tour));

  const payload = {
    tourId: tour.id,
    tourDate: TOUR_DATE,
    customerName: 'Test Cicilan Otomatis',
    customerEmail: 'kustoroterbatas@gmail.com',
    customerPhone: '6281234567890',
    adults: 5,
    children: 0,
    notes: 'TEST otomatis cicilan — boleh dihapus',
    paymentType: 'INSTALLMENT',
    installmentCount: 3,
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
  const order = await p.order.findUnique({
    where: { invoiceNo },
    include: { installmentPlan: { include: { payments: { orderBy: { installmentNumber: 'asc' } } } } },
  });
  console.log('ORDER:', JSON.stringify({
    invoiceNo: order.invoiceNo,
    status: order.status,
    total: order.total,
    paymentType: order.paymentType,
    paymentUrl: order.paymentUrl ? order.paymentUrl.slice(0, 70) + '...' : null,
    snapToken: order.snapToken ? '(ada)' : null,
    expiryAt: order.expiryAt.toISOString(),
  }, null, 1));
  console.log('PLAN:', JSON.stringify({
    status: order.installmentPlan.status,
    installmentCount: order.installmentPlan.installmentCount,
    amountPerInstallment: order.installmentPlan.amountPerInstallment,
    downPayment: order.installmentPlan.downPayment,
    dpPercentage: order.installmentPlan.dpPercentage,
  }, null, 1));
  console.log('PAYMENTS:');
  for (const pay of order.installmentPlan.payments) {
    const url = pay.paymentUrl ? pay.paymentUrl.slice(0, 60) + '...' : '-';
    const exp = pay.paymentExpiryAt ? pay.paymentExpiryAt.toISOString() : '-';
    console.log(`  #${pay.installmentNumber} amount=${pay.amount} due=${pay.dueDate.toISOString().slice(0, 10)} status=${pay.status} snap=${pay.snapToken ? 'ada' : '-'} url=${url} expiry=${exp}`);
  }

  const slot = await p.tourSlot.findUnique({
    where: { tourId_date: { tourId: order.tourId, date: order.tourDate } },
  });
  console.log('SLOT:', JSON.stringify({ date: slot.date.toISOString().slice(0, 10), bookedCount: slot.bookedCount, quota: slot.quota }));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
