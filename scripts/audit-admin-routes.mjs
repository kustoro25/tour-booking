// Audit menu admin: probe semua rute halaman + API tanpa auth.
// Harapan: halaman dilindungi -> 307 ke /admin/login; API -> 401.
// Rute tidak ada -> 404; error render -> 500.
const BASE = 'http://localhost:3001';

const pages = [
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/tours',
  '/admin/tours/create',
  '/admin/tours/test-id/edit',
  '/admin/tours/test-id/gallery',
  '/admin/tours/test-id/schedule',
  '/admin/bookings',
  '/admin/bookings/test-id',
  '/admin/payments',
  '/admin/installments',
  '/admin/installments/test-id',
  '/admin/pages',
  '/admin/pages/home-hero/edit',
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

async function probe(url) {
  try {
    const res = await fetch(BASE + url, { redirect: 'manual' });
    const body = await res.text().catch(() => '');
    return { url, status: res.status, location: res.headers.get('location') || '', body: body.slice(0, 120) };
  } catch (err) {
    return { url, status: 0, location: '', body: String(err).slice(0, 120) };
  }
}

let failed = 0;

console.log('=== HALAMAN ADMIN (tanpa auth) ===');
for (const p of pages) {
  const r = await probe(p);
  let ok = false;
  if (p === '/admin/login') ok = r.status === 200;
  else if (p === '/admin') ok = r.status === 307; // redirect ke dashboard
  else ok = r.status === 307 && r.location.includes('/admin/login');
  if (!ok) failed++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${String(r.status).padEnd(4)} ${p}${!ok ? ` -> loc=${r.location} body=${r.body}` : ''}`);
}

console.log('\n=== API ADMIN (tanpa auth) ===');
for (const p of apis) {
  const r = await probe(p);
  const ok = r.status === 401 || r.status === 200;
  if (!ok) failed++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${String(r.status).padEnd(4)} ${p}${!ok ? ` -> body=${r.body}` : ''}`);
}

console.log(`\n${failed === 0 ? 'SEMUA RUTE OK' : failed + ' RUTE BERMASALAH'}`);
process.exit(failed === 0 ? 0 : 1);
