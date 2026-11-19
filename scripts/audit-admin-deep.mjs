// Probe GET API detail yang dipakai sub-halaman armada & angsuran.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3001';
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const loginRes = await fetch(BASE + '/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'superadmin@gmail.com', password: process.env.ADMIN_PASSWORD || 'admin123' }),
});
const loginBody = await loginRes.json().catch(() => ({}));
if (!loginRes.ok || !loginBody.success) { console.error('LOGIN GAGAL', loginRes.status); process.exit(2); }
const cookie = (loginRes.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');

const toursRes = await fetch(BASE + '/api/admin/tours', { headers: { cookie } });
const tours = (await toursRes.json()).data || [];
const tourId = tours[0]?.id;

const installmentsRes = await fetch(BASE + '/api/admin/installments', { headers: { cookie } });
const inst = (await installmentsRes.json()).data || [];
const planId = inst[0]?.installmentPlan?.id;

let failed = 0;
const check = async (label, url) => {
  const res = await fetch(BASE + url, { headers: { cookie } });
  const body = await res.text().catch(() => '');
  let ok = res.status === 200;
  try { if (JSON.parse(body).success === false) ok = false; } catch {}
  if (!ok) failed++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${String(res.status).padEnd(4)} ${label}${ok ? '' : ' -> ' + body.slice(0, 140).replace(/\s+/g, ' ')}`);
};

if (tourId) {
  await check(`API tour detail ${tourId}`, `/api/admin/tours/${tourId}`);
  await check(`API gallery ${tourId}`, `/api/admin/tours/${tourId}/gallery`);
  await check(`API slots ${tourId}`, `/api/admin/tours/${tourId}/slots`);
} else console.log('SKIP: tidak ada tour');
if (planId) {
  await check(`API plan detail ${planId}`, `/api/admin/installments/${planId}`);
} else console.log('SKIP: tidak ada plan');

console.log(`\n${failed === 0 ? 'SEMUA API DETAIL OK' : failed + ' BERMASALAH'}`);
process.exit(failed === 0 ? 0 : 1);
