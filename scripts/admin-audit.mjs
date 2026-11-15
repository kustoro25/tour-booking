// Audit runtime halaman & API admin — READ-ONLY (hanya GET + login).
// Jalankan: node scripts/admin-audit.mjs
const BASE = 'http://localhost:3000';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail || ''}`);
}

async function login() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@gmail.com', password: 'admin123' }),
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const m = setCookie.match(/admin_token=([^;]+)/);
  if (!m) throw new Error('Login gagal: ' + setCookie);
  return m[1];
}

// === 1. Login ===
const token = await login();
const cookieHeader = `admin_token=${token}`;
record('POST /api/admin/login (superadmin)', true, 'cookie didapat');

// === 2. Semua endpoint GET admin ===
const gets = [
  ['GET /api/admin/bookings?limit=5', '/api/admin/bookings?limit=5'],
  ['GET /api/admin/tours', '/api/admin/tours'],
  ['GET /api/admin/reviews', '/api/admin/reviews'],
  ['GET /api/admin/newsletter?limit=1', '/api/admin/newsletter?limit=1'],
  ['GET /api/admin/installments', '/api/admin/installments'],
  ['GET /api/admin/settings', '/api/admin/settings'],
  ['GET /api/admin/users', '/api/admin/users'],
  ['GET /api/admin/pages', '/api/admin/pages'],
  ['GET /api/admin/me', '/api/admin/me'],
];

// Route PUT-only: GET harus 405 (bukan 404 — menandakan route ada)
try {
  const res = await fetch(`${BASE}/api/admin/me/password`, { headers: { cookie: cookieHeader } });
  record('GET /api/admin/me/password (route PUT-only)', res.status === 405, `HTTP ${res.status}`);
} catch (e) {
  record('GET /api/admin/me/password', false, `exception: ${e.message}`);
}

for (const [name, path] of gets) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { cookie: cookieHeader } });
    const body = await res.json().catch(() => null);
    const ok = res.ok && body && body.success !== false;
    const detail = `HTTP ${res.status}` + (body && !ok ? ` — ${body.error || 'success:false'}` : '') + (ok && body && body.data ? ` (data: ${Array.isArray(body.data) ? body.data.length + ' item' : 'obj'})` : '');
    record(name, ok, detail);
  } catch (e) {
    record(name, false, `exception: ${e.message}`);
  }
}

// === 3. GET detail dengan id nyata (bookings, tours, installments, pages) ===
try {
  const r1 = await fetch(`${BASE}/api/admin/bookings?limit=1`, { headers: { cookie: cookieHeader } });
  const j1 = await r1.json();
  const booking = j1.data?.[0];
  if (booking) {
    const res = await fetch(`${BASE}/api/admin/bookings/${booking.id}`, { headers: { cookie: cookieHeader } });
    const body = await res.json().catch(() => null);
    record('GET /api/admin/bookings/[id]', res.ok && body?.success, `HTTP ${res.status}`);
    // slot & gallery & schedule butuh tourId
    if (booking.tourId) {
      const res2 = await fetch(`${BASE}/api/admin/tours/${booking.tourId}/slots`, { headers: { cookie: cookieHeader } });
      const b2 = await res2.json().catch(() => null);
      record('GET /api/admin/tours/[id]/slots', res2.ok && b2?.success !== false, `HTTP ${res2.status}`);
      const res3 = await fetch(`${BASE}/api/admin/tours/${booking.tourId}/gallery`, { headers: { cookie: cookieHeader } });
      const b3 = await res3.json().catch(() => null);
      record('GET /api/admin/tours/[id]/gallery', res3.ok && b3?.success !== false, `HTTP ${res3.status}`);
    }
  } else {
    record('GET /api/admin/bookings/[id]', false, 'tidak ada data booking untuk diuji (skip)');
  }
} catch (e) {
  record('GET detail bookings', false, `exception: ${e.message}`);
}

try {
  const r1 = await fetch(`${BASE}/api/admin/installments`, { headers: { cookie: cookieHeader } });
  const j1 = await r1.json();
  const plan = j1.data?.find((o) => o.installmentPlan)?.installmentPlan;
  if (plan) {
    const res = await fetch(`${BASE}/api/admin/installments/${plan.id}`, { headers: { cookie: cookieHeader } });
    const body = await res.json().catch(() => null);
    record('GET /api/admin/installments/[id]', res.ok && body?.success, `HTTP ${res.status}`);
  } else {
    record('GET /api/admin/installments/[id]', false, 'tidak ada plan angsuran untuk diuji (skip)');
  }
} catch (e) {
  record('GET installments detail', false, `exception: ${e.message}`);
}

try {
  const r1 = await fetch(`${BASE}/api/admin/pages`, { headers: { cookie: cookieHeader } });
  const j1 = await r1.json();
  const page = j1.data?.[0];
  if (page) {
    const res = await fetch(`${BASE}/api/admin/pages/${page.slug}`, { headers: { cookie: cookieHeader } });
    const body = await res.json().catch(() => null);
    record(`GET /api/admin/pages/${page.slug}`, res.ok && body?.success, `HTTP ${res.status}`);
  }
} catch (e) {
  record('GET pages detail', false, `exception: ${e.message}`);
}

// === 4. Halaman admin (render HTML, cek status + tidak redirect login) ===
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
for (const p of pages) {
  try {
    const res = await fetch(`${BASE}${p}`, { headers: { cookie: cookieHeader }, redirect: 'manual' });
    const isRedirect = res.status >= 300 && res.status < 400;
    const ok = res.status === 200 && !isRedirect;
    record(`GET ${p}`, ok, `HTTP ${res.status}${isRedirect ? ' REDIRECT ke ' + res.headers.get('location') : ''}`);
  } catch (e) {
    record(`GET ${p}`, false, `exception: ${e.message}`);
  }
}

// === 5. Auth guard: tanpa cookie harus redirect ke /admin/login ===
try {
  const res = await fetch(`${BASE}/admin/dashboard`, { redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  record('Middleware guard (tanpa cookie)', res.status === 307 && loc.includes('/admin/login'), `HTTP ${res.status} → ${loc}`);
} catch (e) {
  record('Middleware guard', false, `exception: ${e.message}`);
}

// === 6. Role guard: admin biasa (ADMIN) tidak boleh akses /admin/users & /admin/settings ===
try {
  const resAdmin = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' }),
  });
  const sc = resAdmin.headers.get('set-cookie') || '';
  const m2 = sc.match(/admin_token=([^;]+)/);
  if (m2) {
    const adminCookie = `admin_token=${m2[1]}`;
    const rUsers = await fetch(`${BASE}/admin/users`, { headers: { cookie: adminCookie }, redirect: 'manual' });
    const locUsers = rUsers.headers.get('location') || '';
    record('Role guard ADMIN → /admin/users', rUsers.status === 307 && locUsers.includes('forbidden'), `HTTP ${rUsers.status} → ${locUsers}`);
    const rApiUsers = await fetch(`${BASE}/api/admin/users`, { headers: { cookie: adminCookie } });
    record('Role guard ADMIN → API /api/admin/users', rApiUsers.status === 403, `HTTP ${rApiUsers.status}`);

    // Settings: SUPER_ADMIN only
    const rSettings = await fetch(`${BASE}/admin/settings`, { headers: { cookie: adminCookie }, redirect: 'manual' });
    const locSettings = rSettings.headers.get('location') || '';
    record('Role guard ADMIN → /admin/settings', rSettings.status === 307 && locSettings.includes('forbidden'), `HTTP ${rSettings.status} → ${locSettings}`);

    // Payments: boleh untuk ADMIN (operasional)
    const rPayments = await fetch(`${BASE}/admin/payments`, { headers: { cookie: adminCookie }, redirect: 'manual' });
    record('Role guard ADMIN → /admin/payments (diizinkan)', rPayments.status === 200, `HTTP ${rPayments.status}`);
  }
} catch (e) {
  record('Role guard', false, `exception: ${e.message}`);
}

// === Ringkasan ===
const fails = results.filter((r) => !r.ok);
console.log(`\n=== RINGKASAN: ${results.length - fails.length}/${results.length} lulus, ${fails.length} gagal ===`);
if (fails.length) {
  console.log('Gagal:');
  fails.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
}
