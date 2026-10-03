// Diagnosa: cari order dengan email tertentu + 5 order terbaru.
// Jalankan: node scripts/check-guest-email.cjs [email]
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const invoiceArg = process.argv[2] === '--invoice' ? process.argv[3] : null;
const needle = invoiceArg ? '___nomatch___' : (process.argv[2] || 'akunekhayalan');

async function main() {
  if (invoiceArg) {
    const o = await p.order.findUnique({
      where: { invoiceNo: invoiceArg },
      select: {
        invoiceNo: true, status: true, paymentType: true, total: true,
        customerEmail: true, eticketSentAt: true, paidAt: true,
        installmentPlan: { select: { status: true } },
      },
    });
    console.log('INVOICE:', JSON.stringify(o, null, 1));
  }

  const matches = await p.order.findMany({
    where: { customerEmail: { contains: needle } },
    orderBy: { createdAt: 'desc' },
    select: {
      invoiceNo: true, status: true, paymentType: true, total: true,
      customerName: true, customerEmail: true, createdAt: true, expiryAt: true,
      paymentUrl: true, notes: true, eticketSentAt: true, paidAt: true,
    },
  });
  console.log('MATCHES:', JSON.stringify(matches, null, 1));

  const latest = await p.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      invoiceNo: true, status: true, paymentType: true, total: true,
      customerEmail: true, createdAt: true, eticketSentAt: true,
    },
  });
  console.log('LATEST_5:');
  for (const o of latest) {
    console.log(`  ${o.invoiceNo} [${o.status}] ${o.paymentType} ${o.customerEmail} ${o.createdAt.toISOString()} eticket=${o.eticketSentAt ? o.eticketSentAt.toISOString() : '-'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
