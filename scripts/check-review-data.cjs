// Cek integritas data review: token null, duplikat, order COMPLETED tanpa token.
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const total = await p.order.count();
  const nullTok = await p.order.count({ where: { reviewToken: null } });
  const nullCompleted = await p.order.count({ where: { reviewToken: null, status: 'COMPLETED' } });
  const dup = await p.order.groupBy({
    by: ['reviewToken'],
    _count: { _all: true },
    having: { reviewToken: { _count: { gt: 1 } } },
  });
  const completedNoReview = await p.order.count({
    where: { status: 'COMPLETED', reviewToken: { not: null }, review: null },
  });
  const completedWithReview = await p.order.count({
    where: { status: 'COMPLETED', review: { isNot: null } },
  });
  const reviewCounts = await p.review.groupBy({ by: ['status'], _count: { _all: true } });
  console.log('total order                       :', total);
  console.log('order reviewToken null            :', nullTok);
  console.log('  di antaranya COMPLETED          :', nullCompleted);
  console.log('token duplikat                    :', dup.length);
  console.log('order COMPLETED tanpa review      :', completedNoReview);
  console.log('order COMPLETED sudah review      :', completedWithReview);
  console.log('review per status                 :', JSON.stringify(reviewCounts));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
