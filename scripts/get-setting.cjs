// Tampilkan setting tertentu dari tabel Setting.
// Jalankan: node scripts/get-setting.cjs company_email payment_gateway
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const keys = process.argv.slice(2);
  const rows = await p.setting.findMany({
    where: keys.length ? { key: { in: keys } } : {},
    select: { key: true, value: true },
  });
  for (const r of rows) console.log(`${r.key} = ${r.value}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
