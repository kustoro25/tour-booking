import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { OrderStatusLabels } from '@/types';
import CopyButton from '@/components/ui/CopyButton';
import InvoiceActions from '@/components/booking/InvoiceActions';

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

type InvoiceTheme = 'classic' | 'modern' | 'minimal' | 'premium';

interface ThemeConfig {
  headerBg: string;
  headerText: string;
  headerSubtext: string;
  accent: string;
  accentText: string;
  border: string;
  stripeBg: string;
  badgeBg: string;
  badgeText: string;
}

const themes: Record<Exclude<InvoiceTheme, 'premium'>, ThemeConfig> = {
  classic: {
    headerBg: 'bg-slate-800',
    headerText: 'text-white',
    headerSubtext: 'text-slate-300',
    accent: 'bg-blue-100',
    accentText: 'text-blue-800',
    border: 'border-gray-200',
    stripeBg: 'bg-gray-50/60',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  modern: {
    headerBg: 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700',
    headerText: 'text-white',
    headerSubtext: 'text-blue-100',
    accent: 'bg-indigo-50',
    accentText: 'text-indigo-700',
    border: 'border-blue-100',
    stripeBg: 'bg-blue-50/40',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  minimal: {
    headerBg: 'bg-white border-b-2 border-gray-900',
    headerText: 'text-gray-900',
    headerSubtext: 'text-gray-500',
    accent: 'bg-gray-100',
    accentText: 'text-gray-700',
    border: 'border-gray-200',
    stripeBg: 'bg-white',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
  },
};

export default async function InvoicePage({ params }: PageProps) {
  const { invoice_no } = await params;
  const order = await getOrder(invoice_no);

  if (!order) notFound();

  // Read invoice theme from settings
  let themeKey: InvoiceTheme = 'modern';
  try {
    const themeSetting = await prisma.setting.findUnique({ where: { key: 'invoice_theme' } });
    if (themeSetting) {
      const val = JSON.parse(themeSetting.value);
      if (['classic', 'modern', 'minimal', 'premium'].includes(val)) {
        themeKey = val as InvoiceTheme;
      }
    }
  } catch {
    // fallback to modern
  }

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

  const companyName = 'Jelajah Nusantara Tour';
  const companyAddress = 'Jl. Pariwisata No. 123, Jakarta Selatan';
  const companyPhone = '+62 812-3456-7890';
  const companyEmail = 'info@jelajahnusantara.com';
  const companyTagline = 'Perjalanan Anda, Prioritas Kami';

  const statusLabel = OrderStatusLabels[order.status as keyof typeof OrderStatusLabels] || order.status;
  const tourDate = new Date(order.tourDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const createdDate = new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const expiryDate = new Date(order.expiryAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="max-w-[210mm] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 screen-only">
        {themeKey === 'premium' ? (
          <PremiumInvoice
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
          />
        ) : (
          <InvoiceDocument
            order={order}
            companyName={companyName}
            companyAddress={companyAddress}
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            statusLabel={statusLabel}
            tourDate={tourDate}
            createdDate={createdDate}
            expiryDate={expiryDate}
            bankAccounts={bankAccounts}
            theme={themes[themeKey]}
            themeKey={themeKey}
          />
        )}
        <InvoiceActions
          invoiceNo={order.invoiceNo}
          customerName={order.customerName}
          tourName={order.tour.name}
          total={order.total}
          companyPhone={companyPhone}
        />
      </div>
    </>
  );
}

/* ============ PREMIUM — Geometric Black & Orange Theme ============ */
function PremiumInvoice({
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
}) {
  const priceAdult = order.tour.priceAdult || 0;
  const priceChild = order.tour.priceChild || 0;
  const discountPct = order.tour.discount || 0;

  const adultTotal = priceAdult * order.adults;
  const childTotal = order.children > 0 ? priceChild * order.children : 0;
  const subTotal = adultTotal + childTotal;
  const discountAmount = subTotal * (discountPct / 100);
  const grandTotal = subTotal - discountAmount;

  return (
    <div className="invoice-document bg-white shadow-xl overflow-hidden" id="invoice-print">
      {/* ═══════════ HEADER with geometric shapes ═══════════ */}
      <div className="relative overflow-hidden" style={{ minHeight: '85mm' }}>
        {/* Base black background (covers full header) */}
        <div className="absolute inset-0 bg-[#1A1A1A]" />

        {/* Orange trapezoid — decorative diagonal stripe between white and black */}
        <div
          className="absolute top-0 right-0 h-full w-[60%] bg-[#E59800]"
          style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}
        />

        {/* Small orange accent triangle bottom-left */}
        <div
          className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-[#E59800]"
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }}
        />

        {/* Content rows — left (white) + right (solid black for readable white text) */}
        <div className="relative z-10 flex flex-col sm:flex-row h-full min-h-[85mm]">
          {/* ─── Left Panel: Brand & Invoice Info ─── */}
          <div className="w-full sm:w-[42%] bg-white px-5 sm:px-7 py-6 sm:py-7 flex flex-col justify-between">
            <div>
              {/* Logo + Brand */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#1A1A1A] flex items-center justify-center flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}>
                  <span className="text-[#E59800] text-sm font-extrabold">JN</span>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1A1A1A] leading-tight">{companyName}</h2>
                  <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">{companyTagline}</p>
                </div>
              </div>

              {/* Invoice details */}
              <div className="mt-5 space-y-1.5 text-[11px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 w-14 flex-shrink-0">Invoice#</span>
                  <span className="font-bold text-[#1A1A1A]">{order.invoiceNo}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 w-14 flex-shrink-0">Tanggal</span>
                  <span className="font-medium text-gray-700">{createdDate}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 w-14 flex-shrink-0">Status</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-gray-400 w-14 flex-shrink-0" />
                  <span className="text-[9px] text-gray-400 leading-relaxed">
                    {companyPhone} &nbsp;|&nbsp; {companyAddress} &nbsp;|&nbsp; {companyEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Left-side geometric accent at bottom */}
            <div className="flex items-end gap-1.5">
              <div className="w-2.5 h-8 bg-[#E59800]" />
              <div className="w-6 h-5 bg-[#1A1A1A]" />
              <div className="w-2 h-3 bg-[#E59800]" />
            </div>
          </div>

          {/* ─── Right Panel: INVOICE title + Invoice To (solid black bg) ─── */}
          <div className="w-full sm:w-[58%] bg-[#1A1A1A] px-5 sm:px-8 py-6 sm:py-7 flex flex-col justify-center text-white">
            <div className="mb-5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                INVOICE
              </h1>
              <div className="w-16 h-1 bg-[#E59800] mt-2" />
            </div>

            <div>
              <h3 className="text-[#E59800] text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">
                Invoice to:
              </h3>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white">{order.customerName}</p>
                <p className="text-[11px] text-gray-300">{order.customerEmail}</p>
                <p className="text-[11px] text-gray-300">{order.customerPhone}</p>
              </div>
              <div className="mt-3 space-y-0.5 text-[11px] text-gray-400">
                <p>Tour: {order.tour.name}</p>
                <p>Tanggal Perjalanan: {tourDate}</p>
                <p>Batas Pembayaran: {expiryDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ TABLE ═══════════ */}
      <div className="px-6 sm:px-8 py-6">
        <div className="border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#1A1A1A] text-white grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wider">
            <div className="col-span-1 px-4 py-3 text-center">No.</div>
            <div className="col-span-5 px-4 py-3">Deskripsi</div>
            <div className="col-span-2 px-4 py-3 text-right">Harga</div>
            <div className="col-span-2 px-4 py-3 text-center">Qty.</div>
            <div className="col-span-2 px-4 py-3 text-right">Total</div>
          </div>

          {/* Table Row: Adult */}
          <div className="grid grid-cols-12 text-xs border-b border-gray-100">
            <div className="col-span-1 px-4 py-3 text-center text-gray-400 font-medium">01</div>
            <div className="col-span-5 px-4 py-3">
              <p className="font-semibold text-gray-800">{order.tour.name}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Tiket Dewasa &middot; {order.tour.duration}</p>
            </div>
            <div className="col-span-2 px-4 py-3 text-right font-medium text-gray-700">
              {formatCurrency(priceAdult)}
            </div>
            <div className="col-span-2 px-4 py-3 text-center font-medium text-gray-700">
              {order.adults}
            </div>
            <div className="col-span-2 px-4 py-3 text-right font-semibold text-gray-800">
              {formatCurrency(adultTotal)}
            </div>
          </div>

          {/* Table Row: Child (if any) */}
          {order.children > 0 && (
            <div className="grid grid-cols-12 text-xs border-b border-gray-100">
              <div className="col-span-1 px-4 py-3 text-center text-gray-400 font-medium">02</div>
              <div className="col-span-5 px-4 py-3">
                <p className="font-semibold text-gray-800">{order.tour.name}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">Tiket Anak &middot; {order.tour.duration}</p>
              </div>
              <div className="col-span-2 px-4 py-3 text-right font-medium text-gray-700">
                {formatCurrency(priceChild)}
              </div>
              <div className="col-span-2 px-4 py-3 text-center font-medium text-gray-700">
                {order.children}
              </div>
              <div className="col-span-2 px-4 py-3 text-right font-semibold text-gray-800">
                {formatCurrency(childTotal)}
              </div>
            </div>
          )}

          {/* Discount row (if any) */}
          {discountPct > 0 && (
            <div className="grid grid-cols-12 text-xs border-b border-gray-100">
              <div className="col-span-8 px-4 py-2.5" />
              <div className="col-span-4 px-4 py-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Diskon ({discountPct}%)</span>
                  <span className="font-semibold text-green-700">-{formatCurrency(discountAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Summary Rows ═══ */}
          {/* Sub Total */}
          <div className="grid grid-cols-12 text-sm border-b border-gray-100 bg-gray-50/30">
            <div className="col-span-8 px-4 py-2.5" />
            <div className="col-span-4 px-4 py-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sub Total</span>
                <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
              </div>
            </div>
          </div>

          {/* Tax */}
          <div className="grid grid-cols-12 text-sm border-b border-gray-100 bg-gray-50/30">
            <div className="col-span-8 px-4 py-2.5" />
            <div className="col-span-4 px-4 py-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold text-gray-800">0%</span>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-[#E59800] grid grid-cols-12">
            <div className="col-span-8 px-5 py-3.5" />
            <div className="col-span-4 px-5 py-3.5">
              <div className="flex justify-between items-center">
                <span className="text-base font-extrabold text-white">Total</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ PAYMENT INFO & TERMS ═══════════ */}
        <div className="mt-6">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Informasi Pembayaran
          </h4>
          <div className="space-y-2 mb-4">
            {bankAccounts.map((bank) => (
              <div key={bank.bank} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-x-3 text-xs">
                <span className="font-semibold text-gray-700">Bank {bank.bank}</span>
                <span className="font-mono text-gray-600">{bank.number}</span>
                <span className="text-gray-400">a.n. {bank.name}</span>
                <CopyButton bankNumber={bank.number} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Deadline + Terms */}
            <div>
              <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] mb-4">
                <span className="font-semibold text-amber-800">Batas Pembayaran: </span>
                <span className="text-amber-700">{formatDateTime(order.expiryAt)}</span>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Syarat & Ketentuan
                </h4>
                <p className="text-[9px] text-gray-400 leading-relaxed">
                  Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar
                  dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah
                  pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.
                </p>
              </div>
            </div>

            {/* Right: Signature */}
            <div className="flex flex-col justify-end">
              <div className="text-right">
                <div className="inline-block">
                  <div className="w-32 h-px bg-gray-300 mb-1" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Authorised Sign</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Original themes (classic / modern / minimal) ============ */
function InvoiceDocument({
  order,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  statusLabel,
  tourDate,
  createdDate,
  expiryDate,
  bankAccounts,
  theme: t,
  themeKey,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  statusLabel: string;
  tourDate: string;
  createdDate: string;
  expiryDate: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  theme: ThemeConfig;
  themeKey: Exclude<InvoiceTheme, 'premium'>;
}) {
  return (
    <div
      className={`invoice-document bg-white ${themeKey === 'minimal' ? 'border border-gray-200' : 'shadow-xl'} ${themeKey !== 'minimal' ? 'rounded-xl overflow-hidden' : ''}`}
      id="invoice-print"
    >
      {/* ── Header ── */}
      <div className={`${t.headerBg} px-6 sm:px-10 py-8 sm:py-10`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-10 h-10 rounded-xl ${themeKey === 'minimal' ? 'bg-gray-900' : 'bg-white/20'} flex items-center justify-center text-lg font-bold ${themeKey === 'minimal' ? 'text-white' : 'text-white'}`}>
                JN
              </div>
              <div>
                <h2 className={`text-xl font-bold ${t.headerText}`}>{companyName}</h2>
                <p className={`text-xs ${t.headerSubtext}`}>{companyAddress}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${t.headerText} tracking-tight`}>INVOICE</h1>
            <p className={`text-lg font-mono font-bold ${t.headerSubtext} mt-1`}>{order.invoiceNo}</p>
          </div>
        </div>
      </div>

      {/* ── Status Badge ── */}
      <div className={`px-6 sm:px-10 py-3 ${t.stripeBg} border-b ${t.border}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${t.badgeBg} ${t.badgeText}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
          <span className="text-xs text-gray-400">Diterbitkan: {createdDate}</span>
        </div>
      </div>

      {/* ── Body: Two Columns ── */}
      <div className="px-6 sm:px-10 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ditagihkan Kepada</h3>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-xs text-gray-500">{order.customerEmail}</p>
              <p className="text-xs text-gray-500">{order.customerPhone}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detail Invoice</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Nomor Invoice', value: order.invoiceNo },
                { label: 'Tanggal Invoice', value: createdDate },
                { label: 'Batas Pembayaran', value: expiryDate },
              ].map((row) => (
                <div key={row.label} className="flex sm:flex-col gap-2 sm:gap-0">
                  <span className="text-xs text-gray-400 sm:w-auto">{row.label}</span>
                  <span className="text-xs font-medium text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tour Order Summary ── */}
        <div className={`rounded-xl border ${t.border} overflow-hidden mb-6`}>
          <div className={`px-5 py-3 ${t.accent}`}>
            <h3 className={`text-xs font-semibold ${t.accentText} uppercase tracking-wider`}>Ringkasan Pesanan</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="w-full sm:w-16 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {order.tour.coverImg ? (
                  <img src={order.tour.coverImg} alt={order.tour.name} className="w-full h-full object-cover" />
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
                { label: 'Tgl. Perjalanan', value: tourDate },
                { label: 'Durasi', value: order.tour.duration },
                { label: 'Dewasa', value: `${order.adults} orang` },
                { label: 'Anak', value: order.children > 0 ? `${order.children} orang` : '-' },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg px-3 py-2 ${t.stripeBg}`}>
                  <p className="text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Price Breakdown ── */}
        <div className={`rounded-xl border ${t.border} overflow-hidden mb-6`}>
          <div className={`px-5 py-3 ${t.accent}`}>
            <h3 className={`text-xs font-semibold ${t.accentText} uppercase tracking-wider`}>Rincian Biaya</h3>
          </div>
          <div className="p-5">
            {order.tour.discount > 0 && (
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-500">Diskon</span>
                <span className="font-medium text-green-600">-{order.tour.discount}%</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
              <span className="text-base font-bold text-gray-900">TOTAL</span>
              <span className="text-xl font-extrabold text-blue-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment Instructions ── */}
        <div className={`rounded-xl border ${t.border} overflow-hidden mb-4`}>
          <div className={`px-5 py-3 ${t.accent}`}>
            <h3 className={`text-xs font-semibold ${t.accentText} uppercase tracking-wider`}>Instruksi Pembayaran</h3>
          </div>
          <div className="p-5 space-y-3">
            {bankAccounts.map((bank) => (
              <div key={bank.bank} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {bank.bank.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bank {bank.bank}</p>
                    <p className="text-sm font-mono text-gray-600 tracking-wide">{bank.number}</p>
                    <p className="text-xs text-gray-400">a.n. {bank.name}</p>
                  </div>
                </div>
                <CopyButton bankNumber={bank.number} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Deadline Warning ── */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⏰</span>
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Batas Waktu Pembayaran</p>
              <p className="text-amber-700 mt-0.5">
                Mohon selesaikan pembayaran sebelum <strong>{formatDateTime(order.expiryAt)}</strong>.
                Jika melewati batas waktu, pesanan akan otomatis dibatalkan.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer Note ── */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            Terima kasih telah memilih {companyName} sebagai mitra perjalanan Anda.
            E-Ticket akan dikirim ke email Anda setelah pembayaran terkonfirmasi.
            Untuk bantuan, hubungi {companyPhone} atau {companyEmail}.
          </p>
        </div>
      </div>
    </div>
  );
}
