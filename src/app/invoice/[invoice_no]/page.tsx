import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import InvoiceActions from '@/components/booking/InvoiceActions';
import InvoiceClient from '@/components/pages/InvoiceClient';
import type { PaymentMode, InvoiceCustomConfig } from '@/components/pages/InvoiceClient';
import { getBrandName, getBrandIcon } from '@/lib/brand';
import { getPaymentGateway } from '@/lib/settings';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ invoice_no: string }>;
}

async function getOrder(invoiceNo: string) {
  const order = await prisma.order.findUnique({
    where: { invoiceNo },
    include: {
      tour: true,
      installmentPlan: {
        include: { payments: true },
      },
    },
  });
  return order;
}

type InvoiceTheme = 'premium';

const themeDefaults: Record<string, InvoiceCustomConfig> = {
  premium: {
    companyTagline: 'Perjalanan Anda, Prioritas Kami',
    headerBg: '#1a1a1a',
    headerBgEnd: '#1a1a1a',
    headerTextColor: '#ffffff',
    accentColor: '#e59800',
    borderColor: '#333333',
    headingBilledTo: 'Ditagihkan Kepada',
    headingInvoiceDetails: 'Detail Invoice',
    headingOrderSummary: 'Ringkasan Pesanan',
    headingPriceBreakdown: 'Rincian Biaya',
    headingPaymentInfo: 'Informasi Pembayaran',
    headingDeadline: 'Batas Pembayaran',
    headingTerms: 'Syarat & Ketentuan',
    deadlineText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan.',
    termsText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.',
    paymentInstructionsText: 'Silakan lakukan transfer ke salah satu rekening bank di bawah ini. Pastikan jumlah yang ditransfer sesuai dengan total invoice. Setelah transfer, mohon unggah bukti transfer melalui halaman Jadwal & Bayar DP / Pelunasan (khusus pembayaran DP) atau kirim melalui WhatsApp/email agar pembayaran dapat segera kami verifikasi.',
    labelInvoiceNo: 'No. Invoice',
    labelInvoiceDate: 'Tanggal',
    labelPaymentDeadline: 'Batas Pembayaran',
    labelPublishedDate: 'Diterbitkan:',
    labelTourDate: 'Tanggal Perjalanan',
    labelDuration: 'Durasi',
    labelAdults: 'Dewasa',
    labelChildren: 'Anak',
    labelPricePerAdult: 'Harga / Dewasa',
    labelPricePerChild: 'Harga / Anak',
    labelDiscount: 'Diskon',
    labelSubTotal: 'Sub Total',
    labelTax: 'Pajak',
    labelTotal: 'Total',
    labelBank: 'Bank',
    labelAccountName: 'a.n.',
    labelSignature: 'Tanda Tangan',
    signatureImage: '',
    stampImage: '',
    showStamp: false,
    helpLink: '/contact',
    footerText: 'Terima kasih telah memilih {nama} sebagai mitra perjalanan Anda. E-Ticket akan dikirim ke email Anda setelah pembayaran terkonfirmasi. Untuk bantuan, hubungi {phone} atau {email}.',
    showSignature: true,
    showDeadline: true,
    showTerms: true,
  },
};

export default async function InvoicePage({ params }: PageProps) {
  const { invoice_no } = await params;
  const order = await getOrder(invoice_no);

  if (!order) notFound();

  // 1. Read selected theme from settings — always 'premium'
  const themeKey: InvoiceTheme = 'premium';

  // 2. Always start from hardcoded theme defaults, then overlay CMS config
  const config: InvoiceCustomConfig = { ...themeDefaults['premium'] };
  try {
    const themeCmsPage = await prisma.page.findUnique({ where: { slug: `invoice-${themeKey}` } });
    if (themeCmsPage) {
      try {
        const parsed = JSON.parse(themeCmsPage.content);
        if (parsed && typeof parsed === 'object') {
          // Only overlay non-empty values so CMS empty strings don't wipe themeDefaults
          for (const key of Object.keys(parsed)) {
            const val = (parsed as Record<string, unknown>)[key];
            if (val !== '' && val !== null && val !== undefined) {
              (config as Record<string, unknown>)[key] = val;
            }
          }
        }
      } catch { /* keep defaults */ }
    }
  } catch { /* keep defaults */ }

  // Read bank accounts from settings
  let bankAccounts = [
    { bank: 'BCA', number: '1234567890', name: 'HAYBALI TRANS' },
    { bank: 'Mandiri', number: '0987654321', name: 'HAYBALI TRANS' },
  ];
  try {
    const bankSetting = await prisma.setting.findUnique({ where: { key: 'bank_accounts' } });
    if (bankSetting) {
      bankAccounts = JSON.parse(bankSetting.value);
    }
  } catch {
    // fallback to default
  }

  const brandName = await getBrandName();
  const brandIcon = await getBrandIcon();

  // Pembayaran online (Midtrans):
  // - FULL PENDING → direct ke halaman Snap; INSTALLMENT PENDING → halaman jadwal & bayar angsuran
  const gateway = await getPaymentGateway();
  const payUrl =
    gateway === 'midtrans' && order.status === 'PENDING'
      ? order.paymentType === 'INSTALLMENT'
        ? `/invoice/${order.invoiceNo}/installments`
        : order.paymentUrl || `/api/invoice/${order.invoiceNo}/pay`
      : undefined;

  // Mode tampilan informasi pembayaran pada invoice
  const isPaid = order.status === 'CONFIRMED' || order.status === 'COMPLETED';
  const paymentMode: PaymentMode = isPaid
    ? 'paid'
    : order.status === 'CANCELLED'
      ? 'cancelled'
      : payUrl
        ? 'online'
        : 'transfer';

  // Read company details from settings
  let companyPhone = '+62 851-1933-4511';
  let companyEmail = 'info@haybalitrans.com';
  let companyAddress = 'Jl. Bypass Ngurah Rai, Kedonganan, Kec. Kuta, Kabupaten Badung, Bali 80361';
  try {
    const phoneSetting = await prisma.setting.findUnique({ where: { key: 'company_phone' } });
    if (phoneSetting) {
      const val = JSON.parse(phoneSetting.value);
      if (typeof val === 'string' && val.trim()) companyPhone = val.trim();
    }
    const emailSetting = await prisma.setting.findUnique({ where: { key: 'company_email' } });
    if (emailSetting) {
      const val = JSON.parse(emailSetting.value);
      if (typeof val === 'string' && val.trim()) companyEmail = val.trim();
    }
    const addrSetting = await prisma.setting.findUnique({ where: { key: 'company_address' } });
    if (addrSetting) {
      const val = JSON.parse(addrSetting.value);
      if (typeof val === 'string' && val.trim()) companyAddress = val.trim();
    }
  } catch { /* fallback to defaults */ }

  // URL halaman invoice ini — disertakan di pesan WhatsApp agar bisa diklik
  const hdrs = await headers();
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '';
  const invoiceUrl = host ? `${proto}://${host}/invoice/${order.invoiceNo}` : undefined;

  // Serialisasi order (Date → string ISO) agar bisa diteruskan ke komponen klien.
  const serializedOrder = JSON.parse(JSON.stringify(order));

  return (
    <>
      <div className="invoice-page max-w-[210mm] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <InvoiceClient
          order={serializedOrder}
          companyName={brandName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
          companyEmail={companyEmail}
          brandIcon={brandIcon}
          bankAccounts={bankAccounts}
          config={config}
          paymentMode={paymentMode}
        />
        <InvoiceActions
          invoiceNo={order.invoiceNo}
          customerName={order.customerName}
          tourName={order.tour.name}
          total={order.total}
          companyPhone={companyPhone}
          helpLink={config.helpLink}
          payUrl={payUrl}
          paymentType={order.paymentType}
          tourDate={order.tourDate instanceof Date ? order.tourDate.toISOString() : String(order.tourDate)}
          invoiceUrl={invoiceUrl}
          paymentMode={paymentMode}
        />
      </div>
    </>
  );
}
