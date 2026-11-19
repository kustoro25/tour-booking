// Audit alur review publik: validasi token nyata dari DB (hanya GET, tidak mengubah data).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3001';
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const prisma = new PrismaClient();

async function main() {
  let failed = 0;
  const check = async (label, url, expectStatus) => {
    const res = await fetch(BASE + url);
    const body = await res.text().catch(() => '');
    const ok = res.status === expectStatus;
    if (!ok) failed++;
    console.log(`${ok ? 'OK ' : 'FAIL'} ${String(res.status).padEnd(4)} ${label}${ok ? '' : ' -> ' + body.slice(0, 140).replace(/\s+/g, ' ')}`);
  };

  // 1) Token tidak valid -> 404
  await check('GET /api/reviews/token-palsu', '/api/reviews/token-palsu-xyz', 404);

  // 2) Ambil order nyata dari DB
  const completed = await prisma.order.findFirst({
    where: { status: 'COMPLETED', reviewToken: { not: null }, review: null },
    select: { reviewToken: true, customerName: true },
  });
  if (completed) {
    await check(`GET token order COMPLETED tanpa review (${completed.customerName})`, `/api/reviews/${completed.reviewToken}`, 200);
  } else {
    console.log('SKIP: tidak ada order COMPLETED tanpa review');
  }

  const reviewed = await prisma.order.findFirst({
    where: { status: 'COMPLETED', reviewToken: { not: null }, review: { isNot: null } },
    select: { reviewToken: true, customerName: true },
  });
  if (reviewed) {
    await check(`GET token order sudah review (${reviewed.customerName})`, `/api/reviews/${reviewed.reviewToken}`, 400);
  } else {
    console.log('SKIP: tidak ada order COMPLETED yang sudah review');
  }

  const pendingOrder = await prisma.order.findFirst({
    where: { status: { in: ['PENDING', 'CONFIRMED'] }, reviewToken: { not: null }, review: null },
    select: { reviewToken: true, customerName: true, status: true },
  });
  if (pendingOrder) {
    await check(`GET token order ${pendingOrder.status} (harus ditolak)`, `/api/reviews/${pendingOrder.reviewToken}`, 400);
  } else {
    console.log('SKIP: tidak ada order belum COMPLETED');
  }

  // 3) API publik daftar review APPROVED
  const pub = await fetch(BASE + '/api/reviews');
  const pubJson = await pub.json().catch(() => ({}));
  const pubOk = pub.status === 200 && pubJson.success === true && Array.isArray(pubJson.data);
  const bad = (pubJson.data || []).filter((r) => r.status !== 'APPROVED');
  if (!pubOk || bad.length > 0) failed++;
  console.log(`${pubOk && bad.length === 0 ? 'OK ' : 'FAIL'} ${String(pub.status).padEnd(4)} GET /api/reviews publik (${pubJson.data?.length ?? '?'} review, ${bad.length} tidak APPROVED bocor)`);

  console.log(`\n${failed === 0 ? 'ALUR REVIEW PUBLIK OK' : failed + ' BERMASALAH'}`);
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((e) => { console.error(e); process.exit(2); })
  .finally(() => prisma.$disconnect());
