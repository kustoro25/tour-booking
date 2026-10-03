// Cek status order + plan + payments untuk invoice tertentu (pengujian).
// Jalankan: node scripts/inst-status.cjs <invoiceNo>
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const inv = process.argv[2];

async function main() {
  if (!inv) return console.log('Usage: node scripts/inst-status.cjs <invoiceNo>');
  const order = await p.order.findUnique({
    where: { invoiceNo: inv },
    include: { installmentPlan: { include: { payments: { orderBy: { installmentNumber: 'asc' } } } } },
  });
  if (!order) return console.log('NOT FOUND');
  console.log('ORDER:', JSON.stringify({
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
  }));
  if (!order.installmentPlan) return console.log('(tanpa installmentPlan)');
  console.log('PLAN_STATUS:', order.installmentPlan.status);
  for (const pay of order.installmentPlan.payments) {
    console.log(`  #${pay.installmentNumber} ${pay.status} method=${pay.paymentMethod || '-'} ref=${pay.paymentRef || '-'} by=${pay.adminConfirmedBy || '-'} paidAt=${pay.paidAt ? pay.paidAt.toISOString() : '-'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
