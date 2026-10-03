// Script utilitas pengujian — cek kondisi data (tours, orders, slot).
// Jalankan: node scripts/db-check.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tours = await p.tour.findMany({
    where: { isActive: true },
    select: { id: true, name: true, priceAdult: true, priceChild: true, discount: true, maxSlot: true },
  });
  const ordersByStatus = await p.order.groupBy({ by: ['status'], _count: true });
  const expiredPendingFull = await p.order.count({
    where: { status: 'PENDING', paymentType: 'FULL', expiryAt: { lt: new Date() } },
  });

  console.log('TOURS:', JSON.stringify(tours, null, 1));
  console.log('ORDERS_BY_STATUS:', JSON.stringify(ordersByStatus));
  console.log('EXPIRED_PENDING_FULL:', expiredPendingFull);

  const expiredOrders = await p.order.findMany({
    where: { status: 'PENDING', paymentType: 'FULL', expiryAt: { lt: new Date() } },
    select: { invoiceNo: true, customerName: true, total: true, expiryAt: true, adults: true, children: true, tourId: true, tourDate: true },
  });
  console.log('EXPIRED_ORDERS:', JSON.stringify(expiredOrders, null, 1));

  // Slot untuk beberapa hari ke depan (untuk booking test)
  const upcomingSlots = await p.tourSlot.findMany({
    take: 5,
    orderBy: { date: 'asc' },
    where: { date: { gte: new Date() } },
    select: { tourId: true, date: true, quota: true, bookedCount: true },
  });
  console.log('UPCOMING_SLOTS:', JSON.stringify(upcomingSlots));

  // Detail order tertentu (opsional): node scripts/db-check.cjs <invoiceNo>
  const inv = process.argv[2];
  if (inv) {
    const order = await p.order.findFirst({
      where: { invoiceNo: inv },
      select: {
        invoiceNo: true, status: true, total: true, paymentType: true,
        paymentRef: true, paymentMethod: true, paidAt: true,
        snapToken: true, paymentUrl: true, expiryAt: true, tourDate: true,
      },
    });
    console.log('ORDER_DETAIL:', JSON.stringify(order, null, 1));
  }

  // Daftar akun admin (untuk diagnosa kredensial)
  const users = await p.user.findMany({
    select: { email: true, name: true, role: true },
  });
  console.log('USERS:', JSON.stringify(users));

  // Setting relevan (untuk diagnosa override env)
  const settings = await p.setting.findMany({
    where: { key: { in: ['payment_gateway', 'whatsapp_enabled', 'installment_enabled'] } },
    select: { key: true, value: true },
  });
  console.log('SETTINGS:', JSON.stringify(settings));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
