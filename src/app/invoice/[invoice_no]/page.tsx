import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { OrderStatusLabels, OrderStatusColors, OrderStatusIcons, OrderStatusDotColors, type OrderStatus, type InstallmentPaymentStatus } from '@/types';
import { InstallmentPaymentStatusLabels, InstallmentPaymentStatusColors, InstallmentPaymentStatusDots } from '@/types';
import CopyButton from '@/components/ui/CopyButton';
import InvoiceActions from '@/components/booking/InvoiceActions';
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

/** Mode tampilan blok informasi pembayaran (gateway-aware). */
export type PaymentMode = 'online' | 'transfer' | 'paid' | 'cancelled';

/** Label ramah untuk metode pembayaran dari webhook/DB (Midtrans). */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Kartu Kredit / Debit',
  bank_transfer: 'Virtual Account Bank',
  echannel: 'Mandiri Bill Payment',
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  dana: 'DANA',
  ovo: 'OVO',
  cstore: 'Gerai Retail (Alfamart/Indomaret)',
  akulaku: 'Akulaku',
  manual_transfer: 'Transfer Bank',
  manual: 'Transfer Bank',
};

interface StatusBadgeConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: string;
}

interface InvoiceCustomConfig {
  companyTagline?: string;
  headerBg?: string;
  headerBgEnd?: string;
  headerTextColor?: string;
  accentColor?: string;
  borderColor?: string;
  headingBilledTo?: string;
  headingInvoiceDetails?: string;
  headingOrderSummary?: string;
  headingPriceBreakdown?: string;
  headingPaymentInfo?: string;
  headingDeadline?: string;
  headingTerms?: string;
  deadlineText?: string;
  termsText?: string;
  paymentInstructionsText?: string;
  footerText?: string;
  labelInvoiceNo?: string;
  labelInvoiceDate?: string;
  labelPaymentDeadline?: string;
  labelTourDate?: string;
  labelDuration?: string;
  labelAdults?: string;
  labelChildren?: string;
  labelPricePerAdult?: string;
  labelPricePerChild?: string;
  labelDiscount?: string;
  labelSubTotal?: string;
  labelTax?: string;
  labelTotal?: string;
  labelBank?: string;
  labelAccountName?: string;
  labelSignature?: string;
  signatureImage?: string;
  stampImage?: string;
  showStamp?: boolean;
  labelPublishedDate?: string;
  helpLink?: string;
  showSignature?: boolean;
  showDeadline?: boolean;
  showTerms?: boolean;
  statusBadges?: Record<string, StatusBadgeConfig>;
}

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
    paymentInstructionsText: 'Silakan lakukan transfer ke salah satu rekening bank di bawah ini. Pastikan jumlah yang ditransfer sesuai dengan total invoice. Setelah transfer, mohon unggah bukti transfer melalui halaman Jadwal & Bayar Angsuran (khusus cicilan) atau kirim melalui WhatsApp/email agar pembayaran dapat segera kami verifikasi.',
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
  let companyPhone = '+62 812-3456-7890';
  let companyEmail = 'info@jelajahnusantara.com';
  let companyAddress = 'Jl. Pariwisata No. 123, Jakarta Selatan';
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

  const companyName = brandName;
  const companyTagline = 'Perjalanan Anda, Prioritas Kami';

  const statusLabel = OrderStatusLabels[order.status as keyof typeof OrderStatusLabels] || order.status;
  const tourDate = new Date(order.tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const createdDate = new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const expiryDate = new Date(order.expiryAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="max-w-[210mm] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <CustomInvoice
          order={order}
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
          companyEmail={companyEmail}
          companyTagline={companyTagline}
          brandIcon={brandIcon}
          statusLabel={statusLabel}
          tourDate={tourDate}
          createdDate={createdDate}
          expiryDate={expiryDate}
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
          payLabel={order.paymentType === 'INSTALLMENT' ? '💳 Bayar DP / Angsuran' : undefined}
          paymentMode={paymentMode}
        />
      </div>
    </>
  );
}

/* ============ CUSTOM — Dynamic config from CMS ============ */
function StatBadge({ order }: { order: { status: string } }) {
  const status = (order.status || 'PENDING') as OrderStatus;
  const colors = OrderStatusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  const icon = OrderStatusIcons[status] || '📋';
  const dot = OrderStatusDotColors[status] || 'bg-gray-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{icon}</span>
      <span>{OrderStatusLabels[status] || status}</span>
    </span>
  );
}

function CustomInvoice({
  order,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  brandIcon,
  tourDate,
  createdDate,
  expiryDate,
  bankAccounts,
  config,
  paymentMode,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTagline: string;
  brandIcon: string;
  statusLabel: string;
  tourDate: string;
  createdDate: string;
  expiryDate: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  config: InvoiceCustomConfig;
  paymentMode: PaymentMode;
}) {
  const c = config;
  const H = c.headerBg || '#1e3a5f';
  const He = c.headerBgEnd || H;
  const headerIsLight = themeKeyForCustom(H) === 'light';
  // Solid color unless both colors differ (gradient intended, e.g. Modern theme)
  const headerBg = H === He ? H : `linear-gradient(135deg, ${H}, ${He})`;
  const accent = c.accentColor || '#f59e0b';
  const border = c.borderColor || '#e2e8f0';
  const hText = c.headerTextColor || '#ffffff';
  const hSub = `${hText}99`;
  const stripeBg = 'rgba(0,0,0,0.03)';
  // Proper lightening: mix accent with white (mimics Tailwind *-100/*-50 light colors)
  const accentBg = lightenHex(accent);
  const accentText = accent;

  const priceAdult = order.tour.priceAdult || 0;
  const priceChild = order.tour.priceChild || 0;
  const discountPct = order.tour.discount || 0;

  // Layanan khusus HAYBALI TRANS (sewa mobil & antar-jemput): harga flat,
  // total akhir tersimpan di order.total (sudah termasuk biaya tambahan).
  const isCarRental = order.tour.category === 'CAR_RENTAL';
  const isTransfer = order.tour.category === 'AIRPORT_TRANSFER';
  const isSpecialService = isCarRental || isTransfer;

  // Parse rincian layanan dari kolom extras (JSON)
  let extrasRemoteLabel: string | null = null;
  let extrasRemoteFee = 0;
  let extrasLateFee = 0;
  let extrasDirection: string | null = null;
  let extrasTransferArea: string | null = null;
  let extrasFlightNo: string | null = null;
  if (order.extras) {
    try {
      const extras = JSON.parse(order.extras);
      extrasRemoteLabel = typeof extras.remoteAreaLabel === 'string' ? extras.remoteAreaLabel : null;
      extrasRemoteFee = typeof extras.remoteAreaFee === 'number' ? extras.remoteAreaFee : 0;
      extrasLateFee = typeof extras.latePickupFee === 'number' ? extras.latePickupFee : 0;
      extrasDirection = extras.direction === 'DROP' ? 'Antar ke Bandara' : extras.direction === 'PICKUP' ? 'Jemput di Bandara' : null;
      extrasTransferArea = typeof extras.transferArea === 'string' ? extras.transferArea : null;
      extrasFlightNo = typeof extras.flightNo === 'string' && extras.flightNo ? extras.flightNo : null;
    } catch { /* extras bukan JSON valid — abaikan */ }
  }

  const adultTotal = isSpecialService ? priceAdult : priceAdult * order.adults;
  const childTotal = isSpecialService ? 0 : order.children > 0 ? priceChild * order.children : 0;
  const subTotal = isSpecialService ? order.total : adultTotal + childTotal;
  const discountAmount = isSpecialService ? 0 : subTotal * (discountPct / 100);
  const grandTotal = isSpecialService ? order.total : subTotal - discountAmount;

  const isLight = themeKeyForCustom(hText) === 'light';
  const logoBg = isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.2)';
  const isIconUrl = brandIcon && (brandIcon.startsWith('http://') || brandIcon.startsWith('https://') || brandIcon.startsWith('/'));

  // Editable headings & labels
  const methodLabel = order.paymentMethod
    ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod
    : 'Transfer Bank';
  const T = {
    billedTo: c.headingBilledTo || 'Ditagihkan Kepada',
    invoiceDetails: c.headingInvoiceDetails || 'Detail Invoice',
    orderSummary: c.headingOrderSummary || 'Ringkasan Pesanan',
    priceBreakdown: c.headingPriceBreakdown || 'Rincian Biaya',
    paymentInfo: c.headingPaymentInfo || 'Informasi Pembayaran',
    deadline: c.headingDeadline || 'Batas Pembayaran',
    headingTerms: c.headingTerms || 'Syarat & Ketentuan',
    deadlineBody: (c.deadlineText || 'Mohon selesaikan pembayaran sebelum {{date}}. Jika melewati batas waktu, pesanan akan otomatis dibatalkan.')
      .replace('{{date}}', formatDateTime(order.expiryAt)),
    terms: c.termsText || 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.',
    L: {
      invoiceNo: c.labelInvoiceNo || 'Nomor Invoice',
      invoiceDate: c.labelInvoiceDate || 'Tanggal Invoice',
      paymentDeadline: c.labelPaymentDeadline || 'Batas Pembayaran',
      tourDate: c.labelTourDate || 'Tgl. Perjalanan',
      duration: c.labelDuration || 'Durasi',
      adults: c.labelAdults || 'Dewasa',
      children: c.labelChildren || 'Anak',
      pricePerAdult: c.labelPricePerAdult || 'Harga / Dewasa',
      pricePerChild: c.labelPricePerChild || 'Harga / Anak',
      discount: c.labelDiscount || 'Diskon',
      subTotal: c.labelSubTotal || 'Sub Total',
      tax: c.labelTax || 'Tax',
      total: c.labelTotal || 'TOTAL',
      bank: c.labelBank || 'Bank',
      accountName: c.labelAccountName || 'a.n.',
      signature: c.labelSignature || 'Tanda Tangan',
      publishedDate: c.labelPublishedDate || 'Diterbitkan:',
    },
  };

  return (
    <div className={`invoice-document bg-white ${headerIsLight ? 'border border-gray-200' : 'shadow-xl'} ${headerIsLight ? '' : 'rounded-xl overflow-hidden'}`} id="invoice-print">
      {/* ── Header ── */}
      <div className="px-6 sm:px-10 py-8 sm:py-10" style={{ background: headerBg, ...(headerIsLight ? { borderBottom: `2px solid ${c.borderColor || '#111827'}` } : {}) }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold overflow-hidden" style={{ backgroundColor: isIconUrl ? 'transparent' : logoBg }}>
                {isIconUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={brandIcon} alt={companyName} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: hText }}>{brandIcon}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: hText }}>{companyName}</h2>
                <p className="text-xs" style={{ color: hSub }}>{companyAddress}</p>
                {c.companyTagline && (
                  <p className="text-xs mt-0.5" style={{ color: hSub, opacity: 0.8 }}>{c.companyTagline}</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: hText }}>INVOICE</h1>
            <p className="text-lg font-mono font-bold mt-1" style={{ color: hSub }}>{order.invoiceNo}</p>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="px-6 sm:px-10 py-3" style={{ backgroundColor: stripeBg, borderBottom: `1px solid ${border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
            <StatBadge order={order} />
          </div>
          <span className="text-xs text-gray-400">{T.L.publishedDate} {createdDate}</span>
        </div>
      </div>

      {/* ── Body: Two Columns ── */}
      <div className="px-6 sm:px-10 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{T.billedTo}</h3>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-xs text-gray-500">{order.customerEmail}</p>
              <p className="text-xs text-gray-500">{order.customerPhone}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{T.invoiceDetails}</h3>
            <div className="space-y-1.5">
              {[
                { label: T.L.invoiceNo, value: order.invoiceNo },
                { label: T.L.invoiceDate, value: createdDate },
                ...(paymentMode === 'online' || paymentMode === 'transfer'
                  ? [{ label: T.L.paymentDeadline, value: expiryDate }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex sm:flex-col gap-2 sm:gap-0">
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className="text-xs font-medium text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tour Order Summary ── */}
        <div className="overflow-hidden mb-6" style={{ border: `1px solid ${border}`, borderRadius: '12px' }}>
          <div className="px-5 py-3" style={{ backgroundColor: accentBg }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentText }}>{T.orderSummary}</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="w-full sm:w-16 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                {order.tour.coverImg ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={order.tour.coverImg} alt={order.tour.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🏝️</div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{order.tour.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{order.tour.duration} · {order.tour.destination}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: T.L.tourDate, value: tourDate },
                { label: T.L.duration, value: order.tour.duration },
                { label: isCarRental ? 'Unit' : T.L.adults, value: isCarRental ? '1 Mobil (Supir & BBM)' : `${order.adults} orang` },
                { label: T.L.children, value: !isSpecialService && order.children > 0 ? `${order.children} orang` : '-' },
                // Rincian tambahan layanan sewa mobil
                ...(isCarRental && order.pickupTime ? [{ label: 'Jam Penjemputan', value: `${order.pickupTime} WITA` }] : []),
                ...(isCarRental && order.pickupArea ? [{ label: 'Zona Penjemputan', value: order.pickupArea }] : []),
                ...(isCarRental && extrasRemoteLabel ? [{ label: 'Area Tujuan', value: extrasRemoteLabel }] : []),
                // Rincian tambahan antar-jemput bandara
                ...(isTransfer && extrasDirection ? [{ label: 'Arah', value: extrasDirection }] : []),
                ...(isTransfer && (extrasTransferArea || order.dropoffArea) ? [{ label: 'Area', value: extrasTransferArea || order.dropoffArea }] : []),
                ...(isTransfer && extrasFlightNo ? [{ label: 'No. Penerbangan', value: extrasFlightNo }] : []),
              ].map((item) => (
                <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                  <p className="text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Installment Summary (only for installment orders) ── */}
        {order.paymentType === 'INSTALLMENT' && order.installmentPlan && (
          <div className="overflow-hidden mb-6 relative" style={{ border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div className="px-5 py-3" style={{ backgroundColor: '#FFF7ED' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#E59800' }}>Pembayaran Angsuran (Cicilan)</h3>
            </div>
            <div className="p-5">
              {/* Plan summary */}
              {(() => {
                const plan = order.installmentPlan;
                const payments: { id: string; installmentNumber: number; amount: number; dueDate: string; status: string }[] = plan.payments || [];
                const dpPayment = payments.find((p) => p.installmentNumber === 0);
                const paidCount = payments.filter((p) => p.installmentNumber >= 1 && p.status === 'CONFIRMED').length;
                const hasUnpaid = payments.some((p) => p.status !== 'CONFIRMED');
                
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                        <p className="text-gray-400 mb-0.5">Jumlah Angsuran</p>
                        <p className="font-medium text-gray-800">{plan.installmentCount}x</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                        <p className="text-gray-400 mb-0.5">DP ({plan.dpPercentage}%)</p>
                        <p className="font-medium text-gray-800">{formatCurrency(plan.downPayment)}</p>
                        {dpPayment && (
                          <p className={`text-[10px] font-medium ${dpPayment.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {dpPayment.status === 'CONFIRMED' ? '✓ Lunas' : 'Menunggu'}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                        <p className="text-gray-400 mb-0.5">Per Angsuran</p>
                        <p className="font-medium text-gray-800">{formatCurrency(plan.amountPerInstallment)}</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: paidCount === plan.installmentCount ? '#ECFDF5' : stripeBg }}>
                        <p className="text-gray-400 mb-0.5">Terbayar</p>
                        <p className="font-medium text-gray-800">{paidCount}/{plan.installmentCount}</p>
                      </div>
                    </div>

                    {/* Payment status table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: border }}>
                            <th className="text-left py-2 px-2 text-gray-400 font-medium">Angsuran</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">Jumlah</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">Jatuh Tempo</th>
                            <th className="text-center py-2 px-2 text-gray-400 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => {
                            const st = p.status as InstallmentPaymentStatus;
                            const dotColor = InstallmentPaymentStatusDots[st] || 'bg-gray-500';
                            const label = InstallmentPaymentStatusLabels[st] || st;
                            return (
                              <tr key={p.id} className="border-b" style={{ borderColor: border }}>
                                <td className="py-2 px-2 font-medium text-gray-700">
                                  {p.installmentNumber === 0 ? `DP (${plan.dpPercentage}%)` : `Angsuran ke-${p.installmentNumber}`}
                                </td>
                                <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(p.amount)}</td>
                                <td className="py-2 px-2 text-right text-gray-600">{new Date(p.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${InstallmentPaymentStatusColors[st] || ''}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                    {label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Link ke halaman jadwal & pembayaran angsuran */}
                    {hasUnpaid && (
                      <div className="mt-4 text-center">
                        <a
                          href={`/invoice/${order.invoiceNo}/installments`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#E59800', color: '#fff' }}
                        >
                          💳 Lihat Jadwal & Bayar Angsuran
                        </a>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Price Breakdown ── */}
        <div className="overflow-hidden mb-6 relative" style={{ border: `1px solid ${border}`, borderRadius: '12px' }}>
          <div className="px-5 py-3" style={{ backgroundColor: accentBg }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentText }}>{T.priceBreakdown}</h3>
          </div>
          <div className="p-5 relative">
            {/* ── Stamp Overlay (COMPLETED only) ── */}
            {c.showStamp && order.status === 'COMPLETED' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {c.stampImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={c.stampImage}
                    alt="LUNAS"
                    className="max-h-28 max-w-[180px] object-contain opacity-80"
                    style={{ transform: 'rotate(-15deg)' }}
                  />
                ) : (
                  <div
                    className="border-4 rounded-full px-8 py-4 opacity-30 select-none"
                    style={{
                      borderColor: accent,
                      color: accent,
                      transform: 'rotate(-15deg)',
                    }}
                  >
                    <span className="text-3xl font-black tracking-[0.3em] uppercase">LUNAS</span>
                  </div>
                )}
              </div>
            )}
            {isCarRental ? (
              <>
                {/* Harga sewa mobil (flat per mobil) */}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">Harga Sewa Mobil (12 Jam, Termasuk Supir & BBM)</span>
                  <span className="font-medium text-gray-800">{formatCurrency(priceAdult)}</span>
                </div>
                {/* Biaya area terpencil */}
                {extrasRemoteFee > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">Biaya Area Terpencil{extrasRemoteLabel ? ` — ${extrasRemoteLabel}` : ''}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(extrasRemoteFee)}</span>
                  </div>
                )}
                {/* Biaya jam penjemputan di luar tarif normal */}
                {extrasLateFee > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">Biaya Jam Penjemputan (setelah 10:30)</span>
                    <span className="font-medium text-gray-800">{formatCurrency(extrasLateFee)}</span>
                  </div>
                )}
                {/* Sub Total */}
                <div className="flex justify-between items-center py-2 text-sm border-t border-gray-100">
                  <span className="text-gray-600">{T.L.subTotal}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
                </div>
              </>
            ) : isTransfer ? (
              <>
                {/* Tarif antar-jemput sesuai jumlah penumpang */}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">Tarif Antar-Jemput Bandara ({order.adults} Penumpang)</span>
                  <span className="font-medium text-gray-800">{formatCurrency(subTotal)}</span>
                </div>
                {/* Sub Total */}
                <div className="flex justify-between items-center py-2 text-sm border-t border-gray-100">
                  <span className="text-gray-600">{T.L.subTotal}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
                </div>
              </>
            ) : (
              <>
                {/* Adult line */}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">{T.L.adults} ({order.adults} × {formatCurrency(priceAdult)})</span>
                  <span className="font-medium text-gray-800">{formatCurrency(adultTotal)}</span>
                </div>
                {/* Child line */}
                {order.children > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">{T.L.children} ({order.children} × {formatCurrency(priceChild)})</span>
                    <span className="font-medium text-gray-800">{formatCurrency(childTotal)}</span>
                  </div>
                )}
                {/* Sub Total */}
                <div className="flex justify-between items-center py-2 text-sm border-t border-gray-100">
                  <span className="text-gray-600">{T.L.subTotal}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
                </div>
                {/* Discount */}
                {discountPct > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-green-600">{T.L.discount} ({discountPct}%)</span>
                    <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </>
            )}
            {/* Tax */}
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-gray-600">{T.L.tax}</span>
              <span className="font-medium text-gray-800">0%</span>
            </div>
            {/* Grand Total */}
            <div className="flex justify-between items-center pt-3" style={{ borderTop: `2px solid ${border}` }}>
              <span className="text-base font-bold text-gray-900">{T.L.total}</span>
              <span className="text-xl font-extrabold" style={{ color: accent }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment Instructions (gateway-aware) ── */}
        <div className="mt-6">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {T.paymentInfo}
          </h4>

          {paymentMode === 'online' && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: accentBg, border: `1px solid ${accent}40` }}>
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-semibold" style={{ color: accent }}>Pembayaran online otomatis.</span>{' '}
                {order.paymentType === 'INSTALLMENT' ? (
                  <>
                    Klik tombol <strong>Bayar DP / Angsuran</strong> di bawah invoice ini untuk membayar DP dan setiap
                    angsuran melalui halaman pembayaran aman <strong>Midtrans</strong> — mendukung QRIS, Virtual Account
                    berbagai bank, e-wallet (GoPay, ShopeePay, DANA), dan kartu kredit/debit.
                  </>
                ) : (
                  <>
                    Klik tombol <strong>Bayar Online</strong> di bawah invoice ini untuk menyelesaikan pembayaran melalui
                    halaman pembayaran aman <strong>Midtrans</strong> — mendukung QRIS, Virtual Account berbagai bank,
                    e-wallet (GoPay, ShopeePay, DANA), dan kartu kredit/debit.
                  </>
                )}
              </p>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                {order.paymentType === 'INSTALLMENT' ? (
                  <>
                    Setiap pembayaran (DP &amp; angsuran) <strong>terkonfirmasi otomatis</strong> setelah berhasil —
                    tanpa upload bukti atau konfirmasi manual. Jadwal lengkap tersedia di halaman
                    <strong> Jadwal &amp; Bayar Angsuran</strong>.
                  </>
                ) : (
                  <>
                    Setelah pembayaran berhasil, status pesanan berubah menjadi <strong>Terkonfirmasi</strong> secara
                    otomatis dan E-Ticket dikirim ke email Anda. Tidak perlu konfirmasi manual.
                  </>
                )}
              </p>
            </div>
          )}

          {paymentMode === 'transfer' && (
            <>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {c.paymentInstructionsText || 'Silakan lakukan transfer ke salah satu rekening bank di bawah ini. Pastikan jumlah yang ditransfer sesuai dengan total invoice. Setelah transfer, konfirmasi akan dikirim otomatis ke email Anda.'}
              </p>
              <div className="space-y-2 mb-4">
                {bankAccounts.map((bank) => (
                  <div key={bank.bank} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-x-3 text-xs">
                    <span className="font-semibold text-gray-700">{T.L.bank} {bank.bank}</span>
                    <span className="font-mono text-gray-600">{bank.number}</span>
                    <span className="text-gray-400">{T.L.accountName} {bank.name}</span>
                    <CopyButton bankNumber={bank.number} />
                  </div>
                ))}
              </div>
            </>
          )}

          {paymentMode === 'paid' && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">✅</span>
                <span className="text-xs font-semibold text-green-700">
                  {order.paymentType === 'INSTALLMENT'
                    ? 'Pembayaran DP / angsuran Anda telah kami terima — terima kasih!'
                    : 'Pembayaran Anda telah kami terima — terima kasih!'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
                <div>
                  <p className="text-gray-400 mb-0.5">Metode Pembayaran</p>
                  <p className="font-medium text-gray-700">{methodLabel}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Waktu Pembayaran</p>
                  <p className="font-medium text-gray-700">{order.paidAt ? formatDateTime(order.paidAt) : '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 mb-0.5">Referensi</p>
                  <p className="font-medium text-gray-700 font-mono break-all">{order.paymentRef || '—'}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
                {order.paymentType === 'INSTALLMENT' ? (
                  <>
                    Sisa angsuran dapat dibayar kapan saja melalui halaman <strong>Jadwal &amp; Bayar Angsuran</strong>.
                    E-Ticket dikirim setelah seluruh angsuran lunas. Untuk bantuan, hubungi {companyPhone}.
                  </>
                ) : (
                  <>
                    E-Ticket akan dikirim ke email <strong>{order.customerEmail}</strong>. Untuk bantuan, hubungi {companyPhone}.
                  </>
                )}
              </p>
            </div>
          )}

          {paymentMode === 'cancelled' && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-xs text-red-600 leading-relaxed">
                Pesanan ini telah <strong>dibatalkan</strong> karena melewati batas waktu pembayaran atau dibatalkan oleh admin.
                Jika Anda sudah melakukan pembayaran atau ingin memesan ulang, silakan hubungi {companyPhone} atau {companyEmail}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Deadline + Terms */}
            <div>
              {c.showDeadline !== false && (paymentMode === 'online' || paymentMode === 'transfer') && (
                <div className="rounded-xl px-3 py-2 text-[10px] mb-4" style={{ backgroundColor: accentBg, border: `1px solid ${accent}40` }}>
                  <span className="font-semibold" style={{ color: accent }}>{T.deadline}: </span>
                  <span className="text-gray-600">{formatDateTime(order.expiryAt)}</span>
                  <p className="text-gray-500 mt-1 leading-relaxed">{T.deadlineBody}</p>
                </div>
              )}

              {c.showTerms !== false && (
                <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {T.headingTerms}
                  </h4>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    {T.terms}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Signature */}
            {c.showSignature !== false && (
              <div className="flex flex-col justify-end">
                <div className="text-right">
                  {c.signatureImage ? (
                    <div className="inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.signatureImage} alt="Tanda Tangan" className="max-h-16 max-w-[160px] object-contain mb-1" />
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{T.L.signature}</p>
                    </div>
                  ) : (
                    <div className="inline-block">
                      <div className="w-32 h-px bg-gray-300 mb-1" />
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{T.L.signature}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Note ── */}
        <div className="text-center pt-4 mt-5" style={{ borderTop: `1px solid ${border}` }}>
          <p className="text-xs text-gray-400 leading-relaxed">
            {(c.footerText || 'Terima kasih telah memilih {nama} sebagai mitra perjalanan Anda. E-Ticket akan dikirim ke email Anda setelah pembayaran terkonfirmasi. Untuk bantuan, hubungi {phone} atau {email}.')
              .replace('{nama}', companyName)
              .replace('{phone}', companyPhone)
              .replace('{email}', companyEmail)
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function themeKeyForCustom(hex: string): 'light' | 'dark' {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? 'light' : 'dark';
}

/** Mix hex color with white to create a light background (like Tailwind *-100 shades) */
function lightenHex(hex: string, factor = 0.88): string {
  const h = hex.replace('#', '');
  const r = Math.round(parseInt(h.substring(0, 2), 16) * (1 - factor) + 255 * factor);
  const g = Math.round(parseInt(h.substring(2, 4), 16) * (1 - factor) + 255 * factor);
  const b = Math.round(parseInt(h.substring(4, 6), 16) * (1 - factor) + 255 * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
