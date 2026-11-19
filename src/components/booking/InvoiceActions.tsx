'use client';

import Button from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/client';

interface InvoiceActionsProps {
  invoiceNo: string;
  customerName: string;
  tourName: string;
  total: number;
  companyPhone: string;
  helpLink?: string;
  /** Tanggal perjalanan (ISO) — diformat sesuai locale lalu ditambahkan ke pesan WhatsApp */
  tourDate?: string;
  /** Link halaman invoice — ditambahkan ke pesan WhatsApp agar bisa diklik */
  invoiceUrl?: string;
  /** Mode pembayaran order — menentukan pesan WA yang relevan */
  paymentMode?: 'transfer' | 'paid' | 'cancelled';
}

export default function InvoiceActions({
  invoiceNo,
  customerName,
  tourName,
  total,
  companyPhone,
  helpLink,
  tourDate,
  invoiceUrl,
  paymentMode = 'transfer',
}: InvoiceActionsProps) {
  const { t, locale } = useI18n();
  const waNumber = companyPhone.replace(/[^0-9]/g, '');
  const formattedTotal = `Rp ${total.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US')}`;
  const formattedTourDate = tourDate
    ? new Date(tourDate).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const orderInfo =
    t('invoiceActions.orderInvoice', { no: invoiceNo }) + '\n' +
    (invoiceUrl ? t('invoiceActions.orderLink', { url: invoiceUrl }) + '\n' : '') +
    t('invoiceActions.orderName', { name: customerName }) + '\n' +
    t('invoiceActions.orderPackage', { tour: tourName }) + '\n' +
    (formattedTourDate ? t('invoiceActions.orderDate', { date: formattedTourDate }) + '\n' : '') +
    t('invoiceActions.orderTotal', { total: formattedTotal });

  const waMessage = encodeURIComponent(
    paymentMode === 'paid'
      ? t('invoiceActions.msgPaid', { orderInfo })
      : t('invoiceActions.msgTransfer', { orderInfo })
  );

  const waLabel =
    paymentMode === 'transfer'
      ? t('invoiceActions.labelTransfer')
      : t('invoiceActions.labelOther');

  return (
    <div className="screen-only mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        <Button onClick={() => window.print()} variant="secondary" className="w-full">
          {t('invoiceActions.print')}
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
          ❓ {t('invoiceActions.help')}
        </Button>
      </div>
    </div>
  );
}
