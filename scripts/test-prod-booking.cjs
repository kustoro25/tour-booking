// Uji booking di PRODUKSI: buktikan email tamu + pemilik terkirim (via log Vercel).
// Jalankan: node scripts/test-prod-booking.cjs
const base = 'https://www.demowebsitetraveling.my.id';

const payload = {
  tourId: 'cmqinvk6c000514oc2tw1ymdf', // 2D1N Bromo Sunrise
  tourDate: '2026-10-20',
  customerName: 'Uji Email Produksi',
  customerEmail: 'akunekhayalan@gmail.com',
  customerPhone: '081234567890',
  adults: 5,
  children: 0,
  notes: 'TEST otomatis email produksi — boleh dihapus',
  paymentType: 'FULL',
};

fetch(`${base}/api/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then(async (r) => {
    console.log('HTTP', r.status);
    console.log(await r.text());
  })
  .catch((e) => {
    console.error('FETCH ERROR:', e);
    process.exit(1);
  });
