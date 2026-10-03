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
}

export default function InvoiceActions({
  invoiceNo,
  customerName,
  tourName,
  total,
  companyPhone,
  helpLink,
  payUrl,
}: InvoiceActionsProps) {
  const waNumber = companyPhone.replace(/[^0-9]/g, '');

  const waMessage = encodeURIComponent(
    `Halo, saya ingin konfirmasi pembayaran untuk pesanan:\n` +
    `- Invoice: ${invoiceNo}\n` +
    `- Nama: ${customerName}\n` +
    `- Paket: ${tourName}\n` +
    `- Total: Rp ${total.toLocaleString('id-ID')}\n\n` +
    `Saya sudah melakukan transfer. Berikut bukti pembayarannya.`
  );

  return (
    <div className="screen-only flex flex-wrap justify-center gap-8 mt-6">
      {payUrl && (
        <Button href={payUrl} variant="accent">
          💳 Bayar Online (QRIS / VA / E-Wallet)
        </Button>
      )}
      <Button onClick={() => window.print()} variant="primary">
        🖨️ Cetak Invoice
      </Button>
      <Button
        href={`https://wa.me/${waNumber}?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="accent"
      >
        💬 Konfirmasi Pembayaran
      </Button>
      <Button href={helpLink || '/contact'} variant="outline">
        Butuh Bantuan?
      </Button>
    </div>
  );
}
