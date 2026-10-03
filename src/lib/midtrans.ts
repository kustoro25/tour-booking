// Integrasi Midtrans Snap — https://docs.midtrans.com/docs/snap-snap-integration-guide
// Mode sandbox/production dikontrol oleh env MIDTRANS_IS_PRODUCTION.
// Tanpa MIDTRANS_SERVER_KEY, semua fungsi mengembalikan null/false dengan log
// sehingga alur booking manual tetap berjalan normal.

import crypto from 'crypto';

function isProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

function snapBase(): string {
  return isProduction() ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
}

function authHeader(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

export interface SnapTransactionInput {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { name: string; email: string; phone: string };
  expiryHours?: number;
  finishUrl: string;
}

export async function createSnapTransaction(
  input: SnapTransactionInput
): Promise<{ token: string; redirectUrl: string } | null> {
  if (!isMidtransConfigured()) {
    console.warn('Midtrans belum dikonfigurasi (MIDTRANS_SERVER_KEY/CLIENT_KEY kosong).');
    return null;
  }

  // IDR tidak mengenal desimal — pastikan integer
  const grossAmount = Math.round(input.grossAmount);

  try {
    const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        transaction_details: { order_id: input.orderId, gross_amount: grossAmount },
        item_details: [
          {
            id: input.orderId,
            price: grossAmount,
            quantity: 1,
            name: input.itemName.slice(0, 50),
          },
        ],
        customer_details: {
          first_name: input.customer.name.slice(0, 50),
          email: input.customer.email,
          phone: input.customer.phone,
        },
        expiry: { unit: 'hours', duration: input.expiryHours ?? 24 },
        callbacks: { finish: input.finishUrl },
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token) {
      console.error('Midtrans create transaction failed:', res.status, data);
      return null;
    }

    return { token: data.token as string, redirectUrl: data.redirect_url as string };
  } catch (error) {
    console.error('Midtrans create transaction error:', error);
    return null;
  }
}

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
}

/** SHA512(order_id + status_code + gross_amount + server_key) — wajib diverifikasi. */
export function verifyMidtransSignature(
  payload: Pick<MidtransNotificationPayload, 'order_id' | 'status_code' | 'gross_amount' | 'signature_key'>
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey || !payload.signature_key) return false;

  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');

  if (expected.length !== payload.signature_key.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature_key));
  } catch {
    return false;
  }
}

export type MidtransPaymentState = 'paid' | 'pending' | 'failed' | 'expired' | 'refunded' | 'unknown';

export function mapMidtransState(transactionStatus: string, fraudStatus?: string): MidtransPaymentState {
  switch (transactionStatus) {
    case 'capture':
      return fraudStatus === 'accept' ? 'paid' : 'pending';
    case 'settlement':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'deny':
    case 'cancel':
      return 'failed';
    case 'expire':
      return 'expired';
    case 'refund':
    case 'partial_refund':
      return 'refunded';
    default:
      return 'unknown';
  }
}
