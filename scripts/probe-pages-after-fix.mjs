// Probe render halaman pasca-perbaikan (read-only).
// Jalankan: node scripts/probe-pages-after-fix.mjs
const BASE = process.env.BASE || 'http://localhost:3002';

let failures = 0;
function check(name, ok, extra = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.log(`[${mark}] ${name}${extra ? ' — ' + extra : ''}`);
}

async function main() {
  // Halaman publik
  let res = await fetch(`${BASE}/`);
  check('GET / (home) -> 200', res.status === 200, `status=${res.status}`);

  res = await fetch(`${BASE}/testimonials`);
  check('GET /testimonials -> 200', res.status === 200, `status=${res.status}`);

  res = await fetch(`${BASE}/review/token-palsu-xyz`);
  check('GET /review/[token] -> 200 (validasi di klien)', res.status === 200, `status=${res.status}`);

  // Login admin
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@gmail.com', password: 'admin123' }),
  });
  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');

  res = await fetch(`${BASE}/admin/reviews`, { headers: { cookie } });
  check('GET /admin/reviews -> 200', res.status === 200, `status=${res.status}`);

  res = await fetch(`${BASE}/admin/settings`, { headers: { cookie } });
  check('GET /admin/settings -> 200 (tanpa seksi Google Reviews)', res.status === 200, `status=${res.status}`);

  // Booking detail yang sudah ada di DB (dari audit sebelumnya)
  res = await fetch(`${BASE}/admin/bookings/cmw65wgaz0002qb4geyllu5rf`, { headers: { cookie } });
  check('GET /admin/bookings/[id] -> 200 (dengan seksi Review Tamu)', res.status === 200, `status=${res.status}`);

  console.log(failures === 0 ? '\nSEMUA RENDER LOLOS' : `\n${failures} RENDER GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Probe error:', e);
  process.exit(1);
});
