// Probe runtime perbaikan review (read-only, tidak mengubah data DB).
// Jalankan: node scripts/probe-review-fixes.mjs
const BASE = process.env.BASE || 'http://localhost:3001';

let failures = 0;
function check(name, ok, extra = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.log(`[${mark}] ${name}${extra ? ' — ' + extra : ''}`);
}

async function main() {
  // 1) GET /api/reviews?rating=abc — dulu 500, kini harus 200 (filter diabaikan)
  let res = await fetch(`${BASE}/api/reviews?rating=abc`);
  check('GET /api/reviews?rating=abc -> 200 (dulu 500)', res.status === 200, `status=${res.status}`);

  // 2) GET /api/reviews?rating=5 — valid, tetap 200
  res = await fetch(`${BASE}/api/reviews?rating=5`);
  check('GET /api/reviews?rating=5 -> 200', res.status === 200, `status=${res.status}`);

  // 3) POST review dengan token palsu -> tetap 404 (validasi token jalan duluan)
  res = await fetch(`${BASE}/api/reviews/fake-token-xyz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: '3', reviewText: 'a'.repeat(20), photos: [] }),
  });
  check('POST review token palsu -> 404', res.status === 404, `status=${res.status}`);

  // 4) Rate limit: 6x POST cepat -> yang ke-6 harus 429
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${BASE}/api/reviews/token-${i}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, reviewText: 'a'.repeat(20) }),
    });
    statuses.push(r.status);
  }
  check('Rate limit POST review -> 429 pada percobaan ke-6', statuses[5] === 429, `statuses=${statuses.join(',')}`);

  // 5) Login admin lalu uji pagination API review admin
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@gmail.com', password: 'admin123' }),
  });
  if (!loginRes.ok) {
    check('Login admin', false, `status=${loginRes.status}`);
    return;
  }
  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  check('Login admin + cookie didapat', Boolean(cookie));

  res = await fetch(`${BASE}/api/admin/reviews?page=1&limit=1`, { headers: { cookie } });
  const paged = await res.json().catch(() => ({}));
  check(
    'GET /api/admin/reviews?page=1&limit=1 -> 200 + totalPages',
    res.status === 200 && typeof paged.total === 'number' && typeof paged.totalPages === 'number',
    `total=${paged.total}, totalPages=${paged.totalPages}, items=${paged.data?.length}`
  );

  res = await fetch(`${BASE}/api/admin/reviews?page=999&limit=1`, { headers: { cookie } });
  const far = await res.json().catch(() => ({}));
  check(
    'GET /api/admin/reviews?page=999 -> 200, data kosong, tidak crash',
    res.status === 200 && Array.isArray(far.data) && far.data.length === 0,
    `totalPages=${far.totalPages}`
  );

  // 6) PUT review admin dengan body kosong -> 400 (dulu 500 Prisma)
  res = await fetch(`${BASE}/api/admin/reviews/nonexistent-id`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({}),
  });
  const empty = await res.json().catch(() => ({}));
  check('PUT review body kosong -> 400 (dulu 500)', res.status === 400, `status=${res.status} error="${empty.error}"`);

  // 7) PUT review admin dengan adminReply non-string -> 400
  res = await fetch(`${BASE}/api/admin/reviews/nonexistent-id`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ adminReply: 123 }),
  });
  check('PUT review adminReply bukan string -> 400', res.status === 400, `status=${res.status}`);

  // 8) Halaman /testimonials?page=999 -> harus 200 (klamp, dulu pesan keliru)
  res = await fetch(`${BASE}/testimonials?page=999`);
  check('GET /testimonials?page=999 -> 200 (klamp)', res.status === 200, `status=${res.status}`);

  // 9) GET /api/google-reviews sudah dihapus -> 404
  res = await fetch(`${BASE}/api/google-reviews?placeId=x`);
  check('GET /api/google-reviews -> 404 (rute dihapus)', res.status === 404, `status=${res.status}`);

  console.log(failures === 0 ? '\nSEMUA PROBE LOLOS' : `\n${failures} PROBE GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Probe error:', e);
  process.exit(1);
});
