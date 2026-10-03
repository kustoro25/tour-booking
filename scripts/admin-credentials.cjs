// Utilitas kredensial admin (pengujian lokal).
// Cek:   node scripts/admin-credentials.cjs check            -> uji apakah "admin123" cocok
// Reset: node scripts/admin-credentials.cjs reset <email> <passwordBaru>
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const p = new PrismaClient();

async function main() {
  const mode = process.argv[2] || 'check';

  if (mode === 'check') {
    const users = await p.user.findMany({ select: { email: true, role: true, password: true } });
    for (const u of users) {
      let matchAdmin123 = false;
      try {
        matchAdmin123 = await bcrypt.compare('admin123', u.password);
      } catch { /* hash tidak valid */ }
      console.log(`${u.email} [${u.role}] -> password 'admin123' cocok? ${matchAdmin123 ? 'YA' : 'TIDAK'}`);
    }
  } else if (mode === 'reset') {
    const email = process.argv[3];
    const newPassword = process.argv[4];
    if (!email || !newPassword) {
      console.error('Usage: node scripts/admin-credentials.cjs reset <email> <passwordBaru>');
      process.exit(1);
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    const updated = await p.user.update({ where: { email }, data: { password: hashed } });
    console.log(`Password untuk ${updated.email} berhasil di-reset.`);
  } else {
    console.error('Mode tidak dikenal. Gunakan: check | reset');
    process.exit(1);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
