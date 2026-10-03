// Bandingkan nilai env kunci antara .env lokal dan hasil `vercel env pull`.
// Hanya mencetak MATCH/DIFF — tidak membocorkan password.
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const local = loadEnv(path.join(__dirname, '..', '.env'));
const prod = loadEnv(path.join(__dirname, '..', '.env.production.check'));

const keys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_FROM', 'OWNER_EMAIL', 'NEXT_PUBLIC_SITE_URL', 'PAYMENT_GATEWAY', 'MIDTRANS_IS_PRODUCTION'];

for (const k of keys) {
  const l = local[k];
  const p = prod[k];
  const status = l === undefined && p === undefined ? 'ABSENT-BOTH' : l === p ? 'MATCH' : 'DIFF';
  if (k === 'EMAIL_USER' || k === 'EMAIL_FROM' || k === 'OWNER_EMAIL') {
    console.log(`${k}: ${status} | lokal=${l ?? '-'} | prod=${p ?? '-'}`);
  } else {
    console.log(`${k}: ${status} | lokal_len=${(l ?? '').length} | prod_len=${(p ?? '').length}`);
  }
}

const lp = local.EMAIL_PASS || '';
const pp = prod.EMAIL_PASS || '';
console.log(`EMAIL_PASS: ${lp === pp ? 'MATCH' : 'DIFF'} | lokal_len=${lp.length} | prod_len=${pp.length}`);
