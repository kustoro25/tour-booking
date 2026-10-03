// Simulasi webhook Midtrans untuk pengujian lokal.
//
// Mode 1 (manual/dummy): hitung signature sendiri lalu kirim payload buatan.
//   node scripts/simulate-webhook.cjs <invoiceNo> [grossAmount] [transactionStatus]
//   Contoh: node scripts/simulate-webhook.cjs TRV-2026-XXX 900000.00 settlement
//
// Mode 2 (dari transaksi asli Midtrans): ambil status transaksi via API Midtrans,
// lalu kirim notifikasi dengan field & signature asli (fidelitas penuh).
//   node scripts/simulate-webhook.cjs --from-midtrans <invoiceNo>
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

function sign(orderId, statusCode, grossAmount, serverKey) {
  return crypto.createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest('hex');
}

async function sendToWebhook(payload) {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/midtrans';
  console.log(`Mengirim webhook [${payload.transaction_status}] untuk ${payload.order_id} (${payload.gross_amount}) -> ${webhookUrl}`);
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log('HTTP_STATUS:', res.status);
  console.log('RESPONSE:', await res.text());
}

async function fromMidtrans(invoiceNo, serverKey) {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const base = isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  const auth = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

  const res = await fetch(`${base}/v2/${invoiceNo}/status`, {
    headers: { Authorization: auth, Accept: 'application/json' },
  });
  const data = await res.json().catch(() => null);
  console.log('MIDTRANS_STATUS_API:', res.status, JSON.stringify(data));
  if (!data || !data.order_id) {
    throw new Error('Gagal mengambil status transaksi dari Midtrans.');
  }

  const payload = {
    order_id: data.order_id,
    status_code: data.status_code,
    gross_amount: data.gross_amount,
    signature_key: sign(data.order_id, data.status_code, data.gross_amount, serverKey),
    transaction_status: data.transaction_status,
    fraud_status: data.fraud_status,
    payment_type: data.payment_type,
    transaction_id: data.transaction_id,
  };
  await sendToWebhook(payload);
}

async function manual(invoiceNo, grossAmount, transactionStatus, serverKey) {
  const statusCode = '200';
  const payload = {
    order_id: invoiceNo,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: sign(invoiceNo, statusCode, grossAmount, serverKey),
    transaction_status: transactionStatus,
    fraud_status: 'accept',
    payment_type: 'bank_transfer',
    transaction_id: `SIM-${Date.now()}`,
  };
  await sendToWebhook(payload);
}

async function main() {
  loadEnv();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) {
    console.error('MIDTRANS_SERVER_KEY kosong di .env — isi dulu (dummy juga boleh untuk Mode 1).');
    process.exit(1);
  }

  if (process.argv[2] === '--from-midtrans') {
    const invoiceNo = process.argv[3];
    if (!invoiceNo) {
      console.error('Usage: node scripts/simulate-webhook.cjs --from-midtrans <invoiceNo>');
      process.exit(1);
    }
    await fromMidtrans(invoiceNo, serverKey);
    return;
  }

  const invoiceNo = process.argv[2];
  const grossAmount = process.argv[3] || '900000.00';
  const transactionStatus = process.argv[4] || 'settlement';
  if (!invoiceNo) {
    console.error('Usage: node scripts/simulate-webhook.cjs <invoiceNo> [grossAmount] [transactionStatus]');
    console.error('   atau: node scripts/simulate-webhook.cjs --from-midtrans <invoiceNo>');
    process.exit(1);
  }
  await manual(invoiceNo, grossAmount, transactionStatus, serverKey);
}

main().catch((e) => { console.error(e); process.exit(1); });
