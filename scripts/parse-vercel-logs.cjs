// Parse hasil `vercel logs --json` dan tampilkan pesan yang relevan dengan email/booking.
// Jalankan: node scripts/parse-vercel-logs.cjs logs-5zerwjoda.json logs-oxv2sxjy1.json
const fs = require('fs');

function extract(rec) {
  if (typeof rec.message === 'string') return rec.message;
  if (Array.isArray(rec.messageParts)) {
    return rec.messageParts.map((p) => (typeof p.text === 'string' ? p.text : JSON.stringify(p))).join(' ');
  }
  return JSON.stringify(rec);
}

for (const file of process.argv.slice(2)) {
  console.log(`\n===== ${file} =====`);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.replace(/^\uFEFF/, '').trim();
    if (!line.startsWith('{')) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    const text = extract(rec);
    if (/bookings|Email|EMAIL|SMTP|Failed|contact/i.test(text)) {
      const ts = rec.timestampInMs ? new Date(rec.timestampInMs).toISOString() : (rec.created || '');
      console.log(`${ts} | ${text}`);
    }
  }
}
