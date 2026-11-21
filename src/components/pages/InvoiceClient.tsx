'use client';

// ============================================================================
// InvoiceClient — renderer klien halaman /invoice/[invoice_no]. Data pesanan
// diambil server; teks UI dari kamus i18n. Konfigurasi tema invoice dari CMS
// (Indonesia) dipakai saat locale = id, kamus i18n saat locale = en.
// ============================================================================

import { formatCurrency } from '@/lib/utils';
import { formatUsdFromIdr } from '@/lib/currency';
import { formatTime12h } from '@/lib/haybali';
import CopyButton from '@/components/ui/CopyButton';
import BankLogo, { getBankLogo } from '@/components/ui/BankLogo';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';
import {
  OrderStatusColors,
  OrderStatusIcons,
  OrderStatusDotColors,
  InstallmentPaymentStatusColors,
  InstallmentPaymentStatusDots,
} from '@/types';
import type { InstallmentPaymentStatus, OrderStatus } from '@/types';

/** Mode tampilan blok informasi pembayaran (transfer manual / sudah dibayar / dibatalkan). */
export type PaymentMode = 'transfer' | 'paid' | 'cancelled';

interface StatusBadgeConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: string;
}

export interface InvoiceCustomConfig {
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

interface InvoiceClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any; // hasil JSON.parse(JSON.stringify(order)) — semua Date jadi string ISO
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  brandIcon: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  config: InvoiceCustomConfig;
  paymentMode: PaymentMode;
}

function StatBadge({ order }: { order: { status: string } }) {
  const { tOr } = useI18n();
  const status = (order.status || 'PENDING') as OrderStatus;
  const colors = OrderStatusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  const icon = OrderStatusIcons[status] || '📋';
  const dot = OrderStatusDotColors[status] || 'bg-gray-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{icon}</span>
      <span>{tOr(`status.order.${status}`, status)}</span>
    </span>
  );
}

export default function InvoiceClient({
  order,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  brandIcon,
  bankAccounts,
  config,
  paymentMode,
}: InvoiceClientProps) {
  const { t, tOr, locale, usdRate } = useI18n();
  useTranslatedMeta(t('meta.invoice'));
  const c = config;
  const H = c.headerBg || '#1e3a5f';
  const He = c.headerBgEnd || H;
  const headerIsLight = themeKeyForCustom(H) === 'light';
  // Solid color unless both colors differ (gradient intended)
  const headerBg = H === He ? H : `linear-gradient(135deg, ${H}, ${He})`;
  const accent = c.accentColor || '#f59e0b';
  const border = c.borderColor || '#e2e8f0';
  const hText = c.headerTextColor || '#ffffff';
  const hSub = `${hText}99`;
  const stripeBg = 'rgba(0,0,0,0.03)';
  const accentBg = lightenHex(accent);
  const accentText = accent;

  // Heading/label tema: CMS (Indonesia) saat locale = id, kamus saat locale = en.
  const hd = (cmsKey: keyof InvoiceCustomConfig, dictPath: string): string =>
    locale === 'en' ? t(`invoice.${dictPath}`) : ((c[cmsKey] as string | undefined) || t(`invoice.${dictPath}`));

  const fmtDate = (value: string | number | Date) =>
    new Date(value).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const fmtDateTime = (value: string | number | Date) =>
    new Date(value).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
  let extrasDestinationArea: string | null = null;
  let extrasRemoteFee = 0;
  let extrasLateFee = 0;
  let extrasDuration: string | null = null;
  let extrasBasePrice = 0;
  let extrasDirection: string | null = null;
  let extrasTransferArea: string | null = null;
  let extrasFlightNo: string | null = null;
  if (order.extras) {
    try {
      const extras = JSON.parse(order.extras);
      extrasRemoteLabel = typeof extras.remoteAreaLabel === 'string' ? extras.remoteAreaLabel : null;
      extrasDestinationArea = typeof extras.destinationArea === 'string' ? extras.destinationArea : null;
      extrasRemoteFee = typeof extras.remoteAreaFee === 'number' ? extras.remoteAreaFee : 0;
      extrasLateFee = typeof extras.latePickupFee === 'number' ? extras.latePickupFee : 0;
      extrasBasePrice = typeof extras.basePrice === 'number' ? extras.basePrice : 0;
      extrasDuration = typeof extras.durationLabel === 'string' ? extras.durationLabel : null;
      extrasDirection =
        extras.direction === 'DROP'
          ? t('invoice.dirDrop')
          : extras.direction === 'PICKUP'
            ? t('invoice.dirPickup')
            : null;
      extrasTransferArea = typeof extras.transferArea === 'string' ? extras.transferArea : null;
      extrasFlightNo = typeof extras.flightNo === 'string' && extras.flightNo ? extras.flightNo : null;
    } catch { /* extras bukan JSON valid — abaikan */ }
  }

  // Durasi sewa tersimpan dalam bahasa Indonesia — petakan untuk locale en.
  const tourDurationText =
    locale === 'en' ? String(order.tour.duration || '').replace(/Jam/g, 'Hours') : order.tour.duration;
  const durationText =
    locale === 'en'
      ? extrasDuration === '6 Jam'
        ? '6 Hours'
        : extrasDuration === '12 Jam'
          ? '12 Hours'
          : extrasDuration || '12 Hours'
      : extrasDuration || '12 Jam';

  // Harga sewa dasar: pakai snapshot durasi yang dipilih saat booking;
  // order lama tanpa snapshot memakai harga dewasa tour.
  const carRentalBasePrice = extrasBasePrice > 0 ? extrasBasePrice : priceAdult;

  const adultTotal = isSpecialService ? priceAdult : priceAdult * order.adults;
  const childTotal = isSpecialService ? 0 : order.children > 0 ? priceChild * order.children : 0;
  const subTotal = isSpecialService ? order.total : adultTotal + childTotal;
  const discountAmount = isSpecialService ? 0 : subTotal * (discountPct / 100);
  const grandTotal = isSpecialService ? order.total : subTotal - discountAmount;

  const isLight = themeKeyForCustom(hText) === 'light';
  const logoBg = isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.2)';
  const isIconUrl = brandIcon && (brandIcon.startsWith('http://') || brandIcon.startsWith('https://') || brandIcon.startsWith('/'));

  // Label ramah metode pembayaran (transfer manual) dari DB.
  const methodLabel = order.paymentMethod
    ? tOr(`status.paymentMethods.${order.paymentMethod}`, order.paymentMethod)
    : t('status.paymentMethods.manual');

  const tagline =
    locale === 'en' ? t('invoice.companyTagline') : c.companyTagline || t('invoice.companyTagline');
  const deadlineBodyBase =
    locale === 'en'
      ? t('invoice.deadlineBody')
      : c.deadlineText || t('invoice.deadlineBody');
  const termsText = locale === 'en' ? t('invoice.termsText') : c.termsText || t('invoice.termsText');
  const paymentInstructionsText =
    locale === 'en'
      ? t('invoice.paymentInstructions')
      : c.paymentInstructionsText || t('invoice.paymentInstructions');

  const T = {
    billedTo: hd('headingBilledTo', 'headingBilledTo'),
    invoiceDetails: hd('headingInvoiceDetails', 'headingInvoiceDetails'),
    orderSummary: hd('headingOrderSummary', 'headingOrderSummary'),
    priceBreakdown: hd('headingPriceBreakdown', 'headingPriceBreakdown'),
    paymentInfo: hd('headingPaymentInfo', 'headingPaymentInfo'),
    deadline: hd('headingDeadline', 'headingDeadline'),
    headingTerms: hd('headingTerms', 'headingTerms'),
    deadlineBody: deadlineBodyBase.replace('{{date}}', fmtDateTime(order.expiryAt)),
    terms: termsText,
    paymentInstructions: paymentInstructionsText,
    L: {
      invoiceNo: hd('labelInvoiceNo', 'labelInvoiceNo'),
      invoiceDate: hd('labelInvoiceDate', 'labelInvoiceDate'),
      paymentDeadline: hd('labelPaymentDeadline', 'labelPaymentDeadline'),
      tourDate: hd('labelTourDate', 'labelTourDate'),
      duration: hd('labelDuration', 'labelDuration'),
      adults: hd('labelAdults', 'labelAdults'),
      children: hd('labelChildren', 'labelChildren'),
      pricePerAdult: hd('labelPricePerAdult', 'labelPricePerAdult'),
      pricePerChild: hd('labelPricePerChild', 'labelPricePerChild'),
      discount: hd('labelDiscount', 'labelDiscount'),
      subTotal: hd('labelSubTotal', 'labelSubTotal'),
      tax: hd('labelTax', 'labelTax'),
      total: hd('labelTotal', 'labelTotal'),
      bank: hd('labelBank', 'labelBank'),
      accountName: hd('labelAccountName', 'labelAccountName'),
      signature: hd('labelSignature', 'labelSignature'),
      publishedDate: hd('labelPublishedDate', 'labelPublishedDate'),
    },
  };

  return (
    <div className={`invoice-document bg-white text-gray-900 ${headerIsLight ? 'border border-gray-200' : 'shadow-xl'} ${headerIsLight ? '' : 'rounded-xl overflow-hidden'}`} id="invoice-print">
      {/* ── Header ── */}
      <div className="px-6 sm:px-10 py-8 sm:py-10" style={{ background: headerBg, ...(headerIsLight ? { borderBottom: `2px solid ${c.borderColor || '#111827'}` } : {}) }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold overflow-hidden" style={{ backgroundColor: isIconUrl ? 'transparent' : logoBg }}>
                {isIconUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={brandIcon} alt={companyName} className="w-full h-full object-contain" />
                ) : (
                  <span style={{ color: hText }}>{brandIcon}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: hText }}>{companyName}</h2>
                <p className="text-xs" style={{ color: hSub }}>{companyAddress}</p>
                <p className="text-xs mt-0.5" style={{ color: hSub, opacity: 0.8 }}>{tagline}</p>
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
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('invoice.statusLabel')}</span>
            <StatBadge order={order} />
          </div>
          <span className="text-xs text-gray-400">{T.L.publishedDate} {fmtDate(order.createdAt)}</span>
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
              {order.notes ? (
                <p className="text-xs text-gray-600 pt-2">
                  <span className="font-semibold text-gray-400">{t('invoice.notesLabel')}:</span>{' '}
                  <span className="whitespace-pre-wrap">{String(order.notes)}</span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{T.invoiceDetails}</h3>
            <div className="space-y-1.5">
              {[
                { label: T.L.invoiceNo, value: order.invoiceNo },
                { label: T.L.invoiceDate, value: fmtDate(order.createdAt) },
                ...(paymentMode === 'transfer'
                  ? [{ label: T.L.paymentDeadline, value: fmtDate(order.expiryAt) }]
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
                <p className="text-xs text-gray-500 mt-0.5">{tourDurationText} · {order.tour.destination}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: T.L.tourDate, value: fmtDate(order.tourDate) },
                { label: T.L.duration, value: tourDurationText },
                {
                  label: isCarRental ? t('invoice.unit') : T.L.adults,
                  value: isCarRental ? t('invoice.unitCar') : t('invoice.people', { count: order.adults }),
                },
                {
                  label: T.L.children,
                  value: !isSpecialService && order.children > 0 ? t('invoice.people', { count: order.children }) : '-',
                },
                // Rincian tambahan layanan sewa mobil
                ...(isCarRental && extrasDuration
                  ? [{ label: t('invoice.rentalDuration'), value: durationText }]
                  : []),
                ...(isCarRental && order.pickupTime
                  ? [{ label: t('invoice.pickupTime'), value: `${formatTime12h(order.pickupTime)} WITA` }]
                  : []),
                ...(isCarRental && order.pickupArea
                  ? [{ label: t('invoice.pickupZone'), value: order.pickupArea }]
                  : []),
                ...(isCarRental && (extrasDestinationArea || extrasRemoteLabel)
                  ? [{ label: t('invoice.destinationArea'), value: extrasDestinationArea || extrasRemoteLabel }]
                  : []),
                // Rincian tambahan antar-jemput bandara
                ...(isTransfer && extrasDirection
                  ? [{ label: t('invoice.direction'), value: extrasDirection }]
                  : []),
                ...(isTransfer && (extrasTransferArea || order.dropoffArea)
                  ? [{ label: t('invoice.area'), value: extrasTransferArea || order.dropoffArea }]
                  : []),
                ...(isTransfer && extrasFlightNo
                  ? [{ label: t('invoice.flightNo'), value: extrasFlightNo }]
                  : []),
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
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#E59800' }}>{t('invoice.dpTitle')}</h3>
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
                        <p className="text-gray-400 mb-0.5">{t('invoice.scheme')}</p>
                        <p className="font-medium text-gray-800">{t('invoice.dpSettlement')}</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                        <p className="text-gray-400 mb-0.5">{t('invoice.dpShort', { pct: plan.dpPercentage })}</p>
                        <p className="font-medium text-gray-800">{formatCurrency(plan.downPayment)}</p>
                        {dpPayment && (
                          <p className={`text-[10px] font-medium ${dpPayment.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {dpPayment.status === 'CONFIRMED' ? t('invoice.paidMark') : t('invoice.waiting')}
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: stripeBg }}>
                        <p className="text-gray-400 mb-0.5">{t('invoice.settlement')}</p>
                        <p className="font-medium text-gray-800">{formatCurrency(plan.amountPerInstallment)}</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ backgroundColor: paidCount === plan.installmentCount ? '#ECFDF5' : stripeBg }}>
                        <p className="text-gray-400 mb-0.5">{t('invoice.paidCount')}</p>
                        <p className="font-medium text-gray-800">{paidCount}/{plan.installmentCount}</p>
                      </div>
                    </div>

                    {/* Payment status table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: border }}>
                            <th className="text-left py-2 px-2 text-gray-400 font-medium">{t('invoice.stage')}</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">{t('invoice.amount')}</th>
                            <th className="text-right py-2 px-2 text-gray-400 font-medium">{t('invoice.dueDate')}</th>
                            <th className="text-center py-2 px-2 text-gray-400 font-medium">{t('invoice.statusCol')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => {
                            const st = p.status as InstallmentPaymentStatus;
                            const dotColor = InstallmentPaymentStatusDots[st] || 'bg-gray-500';
                            const label = tOr(`status.installment.${st}`, st);
                            return (
                              <tr key={p.id} className="border-b" style={{ borderColor: border }}>
                                <td className="py-2 px-2 font-medium text-gray-700">
                                  {p.installmentNumber === 0
                                    ? t('invoice.dpShort', { pct: plan.dpPercentage })
                                    : plan.installmentCount === 1
                                      ? t('invoice.settlement')
                                      : t('invoice.installmentNth', { n: p.installmentNumber })}
                                </td>
                                <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(p.amount)}</td>
                                <td className="py-2 px-2 text-right text-gray-600">{fmtDate(p.dueDate)}</td>
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

                    {/* Catatan pelunasan: tunai ke sopir atau transfer bank */}
                    <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
                      {t('invoice.settlementNote')}
                    </p>

                    {/* Link ke halaman jadwal & pembayaran DP/pelunasan */}
                    {hasUnpaid && (
                      <div className="mt-4 text-center">
                        <a
                          href={`/invoice/${order.invoiceNo}/installments`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#E59800', color: '#fff' }}
                        >
                          {t('invoice.viewSchedule')}
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
                  <span className="text-gray-600">{t('invoice.carPrice', { duration: durationText })}</span>
                  <span className="font-medium text-gray-800">{formatCurrency(carRentalBasePrice)}</span>
                </div>
                {/* Biaya area terpencil */}
                {extrasRemoteFee > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">{t('invoice.remoteFee')}{extrasRemoteLabel ? ` — ${extrasRemoteLabel}` : ''}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(extrasRemoteFee)}</span>
                  </div>
                )}
                {/* Biaya jam penjemputan di luar tarif normal */}
                {extrasLateFee > 0 && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">{t('invoice.lateFee')}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(extrasLateFee)}</span>
                  </div>
                )}
                {/* Sub Total */}
                <div className="flex justify-between items-center py-2 text-sm border-t border-gray-100">
                  <span className="text-gray-600">{T.L.subTotal}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('invoice.remoteNote')}
                </p>
              </>
            ) : isTransfer ? (
              <>
                {/* Tarif antar-jemput sesuai jumlah penumpang */}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">{t('invoice.transferFare', { count: order.adults })}</span>
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
            {locale === 'en' && (
              <div className="pt-2 text-right space-y-0.5">
                <p className="text-sm font-semibold text-gray-700">
                  {t('currency.usdEstimate', {
                    usd: formatUsdFromIdr(grandTotal, usdRate),
                    rate: usdRate.toLocaleString('en-US'),
                  })}
                </p>
                <p className="text-[11px] text-gray-500">{t('currency.idrNote')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Instructions (transfer manual) ── */}
        <div className="mt-6">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {T.paymentInfo}
          </h4>

          {paymentMode === 'transfer' && (
            <>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {T.paymentInstructions}
              </p>
              <div className="space-y-3 mb-4">
                {bankAccounts.map((bank) => (
                  <div
                    key={`${bank.bank}-${bank.number}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                  >
                    {getBankLogo(bank.bank) ? (
                      <BankLogo bank={bank.bank} />
                    ) : (
                      <span className="font-semibold text-gray-700">
                        {T.L.bank} {bank.bank}
                      </span>
                    )}
                    <span className="font-mono font-semibold tracking-wide text-gray-700">{bank.number}</span>
                    <span className="text-gray-400">
                      {T.L.accountName} {bank.name}
                    </span>
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
                    ? t('invoice.paidDpTitle')
                    : t('invoice.paidFullTitle')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
                <div>
                  <p className="text-gray-400 mb-0.5">{t('invoice.paymentMethod')}</p>
                  <p className="font-medium text-gray-700">{methodLabel}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">{t('invoice.paymentTime')}</p>
                  <p className="font-medium text-gray-700">{order.paidAt ? fmtDateTime(order.paidAt) : '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 mb-0.5">{t('invoice.reference')}</p>
                  <p className="font-medium text-gray-700 font-mono break-all">{order.paymentRef || '—'}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
                {order.paymentType === 'INSTALLMENT' ? (
                  <>
                    {t('invoice.paidInstNoteA')} {companyPhone}.
                  </>
                ) : (
                  <>
                    {t('invoice.paidFullNoteA')} <strong>{order.customerEmail}</strong>
                    {t('invoice.paidFullNoteB')} {companyPhone}.
                  </>
                )}
              </p>
            </div>
          )}

          {paymentMode === 'cancelled' && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-xs text-red-600 leading-relaxed">
                {t('invoice.cancelledA')} <strong>{t('invoice.cancelledStrong')}</strong>{' '}
                {t('invoice.cancelledB')} {companyPhone} {t('invoice.cancelledC')} {companyEmail}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Deadline + Terms */}
            <div>
              {c.showDeadline !== false && paymentMode === 'transfer' && (
                <div className="rounded-xl px-3 py-2 text-[10px] mb-4" style={{ backgroundColor: accentBg, border: `1px solid ${accent}40` }}>
                  <span className="font-semibold" style={{ color: accent }}>{T.deadline}: </span>
                  <span className="text-gray-600">{fmtDateTime(order.expiryAt)}</span>
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
                      <img src={c.signatureImage} alt={T.L.signature} className="max-h-16 max-w-[160px] object-contain mb-1" />
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
            {hd('footerText', 'footerText')
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
