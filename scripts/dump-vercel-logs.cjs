// Dump detail dari logs-oxv2sxjy1.json: semua pesan unik yang mengandung 'mail',
// plus contoh struktur record agar timestamp bisa dibaca.
const fs = require('fs');

function extract(rec) {
  const parts = [];
  if (typeof rec.message === 'string' && rec.message) parts.push(rec.message);
  if (Array.isArray(rec.messageParts)) {
    for (const p of rec.messageParts) parts.push(typeof p.text === 'string' ? p.text : JSON.stringify(p));
  }
  if (Array.isArray(rec.logs)) {
    for (const l of rec.logs) if (l && typeof l.message === 'string') parts.push(l.message);
  }
  return parts.join(' || ') || JSON.stringify(rec);
}

const lines = fs.readFileSync(process.argv[2] || 'logs-oxv2sxjy1.json', 'utf8').split(/\r?\n/);
const seen = new Set();
let first = null;
for (const raw of lines) {
  const line = raw.replace(/^\uFEFF/, '').trim();
  if (!line.startsWith('{')) continue;
  let rec;
  try { rec = JSON.parse(line); } catch { continue; }
  if (!first) first = rec;
  const text = extract(rec);
  if (/mail/i.test(text) && !seen.has(text)) {
    seen.add(text);
    const ts = rec.timestamp || rec.created || rec.timestampInMs || '';
    console.log(`---- ts=${ts}`);
    console.log(text);
  }
}
console.log('\n===== FIRST RECORD KEYS =====');
console.log(first ? Object.keys(first).join(', ') : 'none');
console.log(JSON.stringify(first, null, 1).slice(0, 800));
