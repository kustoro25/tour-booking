'use client';

import Button from '@/components/ui/Button';

interface InvoiceActionsProps {
  invoiceNo: string;
  customerName: string;
  tourName: string;
  total: number;
  companyPhone: string;
  helpLink?: string;
  /** Link pembayaran online (Midtrans) — tampil hanya jika gateway aktif & order masih PENDING */
  payUrl?: string;
  /** Label tombol bayar online (mis. "Bayar DP / Angsuran" untuk cicilan) */
  payLabel?: string;
  /** Mode pembayaran order — menentukan pesan WA & tombol yang relevan */
  paymentMode?: 'online' | 'transfer' | 'paid' | 'cancelled';
}

export default function InvoiceActions({
  invoiceNo,
  customerName,
  tourName,
  total,
  companyPhone,
  helpLink,
  payUrl,
  payLabel = '💳 Bayar Online Sekarang',
  paymentMode = 'transfer',
}: InvoiceActionsProps) {
  const waNumber = companyPhone.replace(/[^0-9]/g, '');
  const orderInfo =
    `- Invoice: ${invoiceNo}\n` +
    `- Nama: ${customerName}\n` +
    `- Paket: ${tourName}\n` +
    `- Total: Rp ${total.toLocaleString('id-ID')}`;

  const waMessage = encodeURIComponent(
    paymentMode === 'online'
      ? `Halo, saya ingin bertanya mengenai pembayaran online untuk pesanan:\n${orderInfo}`
      : paymentMode === 'paid'
        ? `Halo, saya ingin bertanya mengenai pesanan saya:\n${orderInfo}\n\nPesanan sudah saya bayar, mohon informasi E-Ticket-nya.`
        : `Halo, saya ingin konfirmasi pembayaran untuk pesanan:\n${orderInfo}\n\nSaya sudah melakukan transfer. Berikut bukti pembayarannya.`
  );

  const waLabel =
    paymentMode === 'transfer'
      ? '💬 Konfirmasi Transfer via WhatsApp'
      : paymentMode === 'online'
        ? '💬 Kendala Pembayaran?'
        : '💬 Hubungi Kami';

  return (
    <div className="screen-only flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
      {payUrl && (
        <Button href={payUrl} variant="accent" size="lg">
          {payLabel}
        </Button>
      )}
      <Button onClick={() => window.print()} variant="primary">
        🖨️ Cetak / Simpan PDF
      </Button>
      <Button
        href={`https://wa.me/${waNumber}?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="accent"
      >
        {waLabel}
      </Button>
      <Button href={helpLink || '/contact'} variant="outline">
        Butuh Bantuan?
      </Button>
    </div>
  );
}
