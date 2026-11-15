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
  /** Tanggal perjalanan — ditambahkan ke pesan WhatsApp */
  tourDate?: string;
  /** Link halaman invoice — ditambahkan ke pesan WhatsApp agar bisa diklik */
  invoiceUrl?: string;
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
  tourDate,
  invoiceUrl,
  paymentMode = 'transfer',
}: InvoiceActionsProps) {
  const waNumber = companyPhone.replace(/[^0-9]/g, '');
  const orderInfo =
    `- Invoice: ${invoiceNo}\n` +
    (invoiceUrl ? `- Link Invoice: ${invoiceUrl}\n` : '') +
    `- Nama: ${customerName}\n` +
    `- Paket: ${tourName}\n` +
    (tourDate ? `- Tanggal: ${tourDate}\n` : '') +
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
    <div className="screen-only mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {/* Aksi utama: bayar online (tampil penuh di atas bila tersedia) */}
        {payUrl && (
          <Button href={payUrl} variant="accent" size="lg" className="sm:col-span-2 w-full">
            {payLabel}
          </Button>
        )}
        <Button onClick={() => window.print()} variant="secondary" className="w-full">
          🖨️ Cetak / Simpan PDF
        </Button>
        <Button
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="accent"
          className="w-full"
        >
          {waLabel}
        </Button>
        <Button
          href={helpLink || '/contact'}
          variant="outline"
          className="w-full sm:col-span-2 sm:w-auto sm:justify-self-center sm:px-10"
        >
          ❓ Butuh Bantuan?
        </Button>
      </div>
    </div>
  );
}
