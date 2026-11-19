// Audit alur sub-halaman admin dengan ID nyata dari DB.
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

async function main() {
  const loginRes = await fetch(BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'superadmin@gmail.com', password: process.env.ADMIN_PASSWORD || 'admin123' }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginBody.success) {
    console.error('LOGIN GAGAL:', loginRes.status, JSON.stringify(loginBody).slice(0, 200));
    process.exit(2);
  }
  const cookie = (loginRes.headers.getSetCookie?.() || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  console.log('LOGIN OK:', loginBody.data?.user?.role, '| cookie:', cookie.slice(0, 40) + '...\n');

  let failed = 0;
  const check = async (label, url, expect) => {
    const res = await fetch(BASE + url, { headers: { cookie } });
    const body = await res.text().catch(() => '');
    let ok = res.status === 200;
    let json = null;
    try { json = JSON.parse(body); } catch {}
    if (json && json.success === false) ok = false;
    if (!ok) failed++;
    console.log(`${ok ? 'OK ' : 'FAIL'} ${String(res.status).padEnd(4)} ${label}${ok ? '' : ' -> ' + body.slice(0, 150).replace(/\s+/g, ' ')}`);
    return json;
  };

  // Ambil ID nyata
  const bookings = await check('API bookings list', '/api/admin/bookings?limit=3');
  const tours = await check('API tours list', '/api/admin/tours');
  const installments = await check('API installments list', '/api/admin/installments');
  const pages = await check('API pages list', '/api/admin/pages');
  const reviews = await check('API reviews list', '/api/admin/reviews');

  const bookingId = bookings?.data?.[0]?.id;
  const tourId = tours?.data?.[0]?.id;
  const planId = installments?.data?.[0]?.installmentPlan?.id;
  const pageSlug = pages?.data?.[0]?.slug || 'home-hero';
  const reviewId = reviews?.data?.[0]?.id;

  console.log('\n--- Alur sub-halaman ---');
  if (bookingId) {
    await check(`Halaman detail booking ${bookingId}`, `/admin/bookings/${bookingId}`);
    await check(`API booking detail ${bookingId}`, `/api/admin/bookings/${bookingId}`);
  } else console.log('SKIP: tidak ada booking');
  if (tourId) {
    await check(`Halaman edit armada ${tourId}`, `/admin/tours/${tourId}/edit`);
    await check(`Halaman galeri ${tourId}`, `/admin/tours/${tourId}/gallery`);
    await check(`Halaman jadwal ${tourId}`, `/admin/tours/${tourId}/schedule`);
  } else console.log('SKIP: tidak ada armada');
  if (planId) {
    await check(`Halaman kelola angsuran ${planId}`, `/admin/installments/${planId}`);
    await check(`API angsuran detail ${planId}`, `/api/admin/installments/${planId}`);
  } else console.log('SKIP: tidak ada plan angsuran');
  await check(`Halaman edit CMS ${pageSlug}`, `/admin/pages/${pageSlug}/edit`);
  await check(`API CMS detail ${pageSlug}`, `/api/admin/pages/${pageSlug}`);
  if (reviewId) await check(`API review detail ${reviewId}`, `/api/admin/reviews/${reviewId}`);

  console.log(`\n${failed === 0 ? 'SEMUA ALUR SUB-HALAMAN OK' : failed + ' BERMASALAH'}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
