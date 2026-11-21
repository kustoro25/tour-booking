// Ganti daftar rekening bank aktif di tabel Setting (key: bank_accounts).
// Jalankan: node scripts/update-bank-accounts.cjs
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const accounts = [
  { bank: 'BCA', number: '0402946260', name: 'Ni KADEK DESY MAHADEWI' },
];

async function main() {
  const value = JSON.stringify(accounts);
  await p.setting.upsert({
    where: { key: 'bank_accounts' },
    update: { value },
    create: { key: 'bank_accounts', value },
  });
  console.log('bank_accounts =', value);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
