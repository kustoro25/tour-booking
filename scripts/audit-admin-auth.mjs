// Audit menu admin: login asli + render semua halaman & API dengan token.
// Harapan halaman: 200. API: 200 (success true). Error internal -> FAIL.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3001';

// Load .env (tanpa override)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const EMAIL = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
const PASS = process.env.ADMIN_PASSWORD || 'admin123';

const pages = [
  '/admin/dashboard',
  '/admin/tours',
  '/admin/tours/create',
  '/admin/bookings',
  '/admin/payments',
  '/admin/installments',
  '/admin/pages',
  '/admin/reviews',
  '/admin/newsletter',
  '/admin/users',
  '/admin/users/create',
  '/admin/settings',
];

const apis = [
  '/api/admin/bookings?limit=5',
  '/api/admin/tours',
  '/api/admin/reviews',
  '/api/admin/newsletter?limit=1',
  '/api/admin/installments',
  '/api/admin/pages',
  '/api/admin/users',
  '/api/admin/settings',
  '/api/admin/me',
];

async function main() {
  // 1) Login
  const loginRes = await fetch(BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginBody.success) {
    console.error('LOGIN GAGAL:', loginRes.status, JSON.stringify(loginBody).slice(0, 300));
    process.exit(2);
  }
  const cookie = loginRes.headers.get('set-cookie') || '';
  console.log(`LOGIN OK: ${EMAIL} (${loginBody.data?.user?.role})\n`);

  let failed = 0;

  console.log('=== HALAMAN ADMIN (dengan token) ===');
  for (const p of pages) {
    const res = await fetch(BASE + p, { headers: { cookie }, redirect: 'manual' });
    const body = await res.text().catch(() => '');
    const ok = res.status === 200;
    if (!ok) failed++;
    console.log(`${ok ? 'OK ' : 'FAIL'} ${String(res.status).padEnd(4)} ${p}${ok ? '' : ' -> ' + body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }

  console.log('\n=== API ADMIN (dengan token) ===');
  for (const p of apis) {
    const res = await fetch(BASE + p, { headers: { cookie } });
    const body = await res.text().catch(() => '');
    let ok = res.status === 200;
    try {
      const json = JSON.parse(body);
      if (json.success === false) ok = false;
    } catch { ok = false; }
    if (!ok) failed++;
    console.log(`${ok ? 'OK ' : 'FAIL'} ${String(res.status).padEnd(4)} ${p}${ok ? '' : ' -> ' + body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }

  console.log(`\n${failed === 0 ? 'SEMUA HALAMAN & API OK' : failed + ' BERMASALAH'}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
