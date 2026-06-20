import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { OrderStatusLabels, OrderStatusColors, OrderStatusIcons, OrderStatusDotColors, type OrderStatus } from '@/types';
import CopyButton from '@/components/ui/CopyButton';
import InvoiceActions from '@/components/booking/InvoiceActions';
import { getBrandName } from '@/lib/brand';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ invoice_no: string }>;
}

async function getOrder(invoiceNo: string) {
  const order = await prisma.order.findUnique({
    where: { invoiceNo },
    include: { tour: true },
  });
  return order;
}

type InvoiceTheme = 'premium';

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
    headingBilledTo: 'Invoice to:',
    headingInvoiceDetails: 'Detail Invoice',
    headingOrderSummary: 'Ringkasan Pesanan',
    headingPriceBreakdown: 'Rincian Biaya',
    headingPaymentInfo: 'Informasi Pembayaran',
    headingDeadline: 'Batas Pembayaran',
    headingTerms: 'Syarat & Ketentuan',
    deadlineText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan.',
    termsText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.',
    paymentInstructionsText: 'Silakan lakukan transfer ke salah satu rekening bank di bawah ini. Pastikan jumlah yang ditransfer sesuai dengan total invoice. Setelah transfer, konfirmasi akan dikirim otomatis ke email Anda.',
    labelInvoiceNo: 'Invoice#',
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
    labelTax: 'Tax',
    labelTotal: 'Total',
    labelBank: 'Bank',
    labelAccountName: 'a.n.',
    labelSignature: 'Authorised Sign',
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
    { bank: 'BCA', number: '1234567890', name: 'PT Jelajah Nusantara' },
    { bank: 'Mandiri', number: '0987654321', name: 'PT Jelajah Nusantara' },
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
          statusLabel={statusLabel}
          tourDate={tourDate}
          createdDate={createdDate}
          expiryDate={expiryDate}
          bankAccounts={bankAccounts}
          config={config}
        />
        <InvoiceActions
          invoiceNo={order.invoiceNo}
          customerName={order.customerName}
          tourName={order.tour.name}
          total={order.total}
          companyPhone={companyPhone}
          helpLink={config.helpLink}
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
  companyTagline,
  statusLabel,
  tourDate,
  createdDate,
  expiryDate,
  bankAccounts,
  config,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTagline: string;
  statusLabel: string;
  tourDate: string;
  createdDate: string;
  expiryDate: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  config: InvoiceCustomConfig;
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
  const adultTotal = priceAdult * order.adults;
  const childTotal = order.children > 0 ? priceChild * order.children : 0;
  const subTotal = adultTotal + childTotal;
  const discountAmount = subTotal * (discountPct / 100);
  const grandTotal = subTotal - discountAmount;

  const isLight = themeKeyForCustom(hText) === 'light';
  const logoBg = isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.2)';

  // Editable headings & labels
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
      signature: c.labelSignature || 'Authorised Sign',
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: logoBg }}>
                <span style={{ color: hText }}>JN</span>
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

      {/* ── Status Badge ── */}
      <div className="px-6 sm:px-10 py-3" style={{ backgroundColor: stripeBg, borderBottom: `1px solid ${border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatBadge order={order} />
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
                { label: T.L.paymentDeadline, value: expiryDate },
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
                { label: T.L.adults, value: `${order.adults} orang` },
                { label: T.L.children, value: order.children > 0 ? `${order.children} orang` : '-' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                  <p className="text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Price Breakdown ── */}
        <div className="overflow-hidden mb-6" style={{ border: `1px solid ${border}`, borderRadius: '12px' }}>
          <div className="px-5 py-3" style={{ backgroundColor: accentBg }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentText }}>{T.priceBreakdown}</h3>
          </div>
          <div className="p-5">
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

        {/* ── Payment Instructions ── */}
        <div className="mt-6">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {T.paymentInfo}
          </h4>
          {/* Transfer instructions text */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Deadline + Terms */}
            <div>
              {c.showDeadline !== false && (
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
                  <div className="inline-block">
                    <div className="w-32 h-px bg-gray-300 mb-1" />
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">{T.L.signature}</p>
                  </div>
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
