'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { formatUsdFromIdr } from '@/lib/currency';
import { Skeleton } from '@/components/ui/Skeleton';
import CopyButton from '@/components/ui/CopyButton';
import { InstallmentPaymentStatusColors, InstallmentPaymentStatusDots } from '@/types';
import type { InstallmentPaymentStatus } from '@/types';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

// Halaman privat per invoice — jangan di-cache, datanya berubah tiap pembayaran.
export const dynamic = 'force-dynamic';

interface Payment {
  id: string;
  installmentNumber: number; // 0 = DP (uang muka)
  amount: number;
  dueDate: string;
  status: InstallmentPaymentStatus;
  paymentProof: string | null;
  paymentMethod: string | null;
  paymentRef: string | null;
  adminConfirmedAt: string | null;
  paidAt: string | null;
}

interface Plan {
  id: string;
  totalAmount: number;
  installmentCount: number;
  amountPerInstallment: number;
  downPayment: number;
  dpPercentage: number;
  status: string;
  agreementDocUrl: string | null;
}

interface InstallmentData {
  order: {
    invoiceNo: string;
    customerName: string;
    total: number;
    paymentType: string;
    tour: { name: string; duration: string };
  };
  plan: Plan;
  payments: Payment[];
}

interface BankAccount {
  bank: string;
  number: string;
  name: string;
}

export default function InstallmentTrackingPage() {
  const { t, tOr, locale, usdRate } = useI18n();
  useTranslatedMeta(t('meta.invoice'));
  const dateLocale = locale === 'id' ? 'id-ID' : 'en-US';
  const params = useParams();
  const invoiceNo = params.invoice_no as string;

  const [data, setData] = useState<InstallmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const fetchData = useCallback(() => {
    return fetch(`/api/installments/${invoiceNo}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error || t('installments.loadFailed'));
      })
      .catch(() => setError(t('installments.serverError')));
  }, [invoiceNo, t]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Rekening & kontak perusahaan dari settings publik
  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          if (Array.isArray(res.data.bank_accounts)) setBanks(res.data.bank_accounts);
          if (typeof res.data.company_phone === 'string') setCompanyPhone(res.data.company_phone);
          if (typeof res.data.company_email === 'string') setCompanyEmail(res.data.company_email);
        }
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-ink-850 rounded-xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-mist mb-2">{error || t('installments.notFound')}</h2>
        <Link href="/" className="text-gold-300 hover:underline">{t('installments.backHome')}</Link>
      </div>
    );
  }

  const { plan, payments, order } = data;
  const dpPayment = payments.find((p) => p.installmentNumber === 0);
  const nextUnpaid = payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const labelFor = (p: Payment) =>
    p.installmentNumber === 0
      ? t('installments.dpFull', { pct: plan.dpPercentage })
      : plan.installmentCount === 1
        ? t('installments.settlementShort')
        : t('installments.installmentNth', { n: p.installmentNumber });

  // Bukti transfer TIDAK diunggah di website — pelanggan kirim via WhatsApp/email ke admin.
  const waDigits = companyPhone.replace(/\D/g, '');
  const waLink = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Halo admin, saya ingin konfirmasi pembayaran untuk invoice ${invoiceNo} (${order.customerName}). Berikut saya lampirkan bukti transfernya.`)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href={`/invoice/${invoiceNo}`} className="text-gold-300 hover:underline text-sm mb-4 inline-block">
        ← {t('installments.backToInvoice')}
      </Link>

      <h1 className="text-2xl font-bold text-ivory mb-1">{t('installments.title')}</h1>
      <p className="text-mist-dim text-sm mb-6">
        {order.tour.name} &bull; {t('installments.invoiceLabel')} {invoiceNo}
      </p>

      {/* Summary */}
      <div className="bg-ink-850 rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-mist-dim text-xs">{t('installments.totalLabel')}</span>
            <p className="font-semibold">{formatCurrency(plan.totalAmount)}</p>
            {locale === 'en' && (
              <p className="text-[11px] text-mist-dim">
                {t('currency.usdEstimate', {
                  usd: formatUsdFromIdr(plan.totalAmount, usdRate),
                  rate: usdRate.toLocaleString('en-US'),
                })}
              </p>
            )}
          </div>
          <div>
            <span className="text-mist-dim text-xs">{t('installments.dpLabel', { pct: plan.dpPercentage })}</span>
            <p className="font-semibold text-gold-300">{formatCurrency(plan.downPayment)}</p>
            {dpPayment && (
              <span className={`text-[10px] font-medium ${dpPayment.status === 'CONFIRMED' ? 'text-emerald-300' : 'text-gold-300'}`}>
                {dpPayment.status === 'CONFIRMED' ? t('invoice.paidMark') : t('invoice.waiting')}
              </span>
            )}
          </div>
          <div>
            <span className="text-mist-dim text-xs">{t('installments.settlementLabel')}</span>
            <p className="font-semibold">
              {plan.installmentCount === 1
                ? `${formatCurrency(plan.amountPerInstallment)} ${t('installments.settlementSingle')}`
                : t('installments.settlementMulti', { count: plan.installmentCount, amount: formatCurrency(plan.amountPerInstallment) })}
            </p>
          </div>
          <div>
            <span className="text-mist-dim text-xs">{t('installments.statusLabel')}</span>
            <p className={`font-semibold ${plan.status === 'COMPLETED' ? 'text-green-300' : plan.status === 'CANCELLED' ? 'text-red-300' : 'text-gold-300'}`}>
              {plan.status === 'ACTIVE' ? t('installments.planActive') : plan.status === 'COMPLETED' ? t('installments.planCompleted') : t('installments.planCancelled')}
            </p>
          </div>
        </div>
        {locale === 'en' && (
          <p className="text-xs text-mist-dim mt-4 pt-4 border-t border-ink-700">{t('currency.idrNote')}</p>
        )}
      </div>

      {/* Rekening Pembayaran (transfer bank) */}
      {banks.length > 0 && (
        <div className="bg-ink-850 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3 bg-gold-400/10 border-b border-gold-500/20">
            <h3 className="text-sm font-semibold text-gold-200">{t('installments.bankTitle')}</h3>
            <p className="text-xs text-gold-300 mt-0.5">
              {t('installments.bankDesc')}
            </p>
          </div>
          <div className="p-5 space-y-3">
            {banks.map((b) => (
              <div
                key={`${b.bank}-${b.number}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border border-ink-700 rounded-lg px-4 py-3"
              >
                <div>
                  <span className="font-semibold text-ivory">{b.bank}</span>
                  <span className="text-mist mx-2">•</span>
                  <span className="font-mono text-mist">{b.number}</span>
                  <p className="text-xs text-mist-dim mt-0.5">{b.name}</p>
                </div>
                <CopyButton bankNumber={b.number} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kirim Bukti Transfer (WA/email — bukan upload di website) */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-emerald-300 mb-1">{t('installments.sendProofTitle')}</h3>
        <p className="text-xs text-emerald-200/80 mb-3">{t('installments.sendProofDesc')}</p>
        <div className="flex flex-wrap items-center gap-3">
          {waDigits && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {t('installments.sendProofWaBtn')}
            </a>
          )}
          {companyEmail && (
            <a href={`mailto:${companyEmail}`} className="text-xs text-emerald-300 hover:underline">
              {t('installments.sendProofEmail', { email: companyEmail })}
            </a>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-ink-850 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-gold-400/10 border-b border-orange-100">
          <h3 className="text-sm font-semibold text-orange-800">{t('installments.scheduleTitle')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-mist-dim text-xs">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">{t('installments.stage')}</th>
                <th className="py-2.5 px-4 text-right font-medium">{t('installments.amount')}</th>
                <th className="py-2.5 px-4 text-right font-medium">{t('installments.dueDate')}</th>
                <th className="py-2.5 px-4 text-center font-medium">{t('installments.statusCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700">
              {payments.map((p) => {
                const st = p.status as InstallmentPaymentStatus;
                const dotColor = InstallmentPaymentStatusDots[st] || 'bg-gray-500';
                const colors = InstallmentPaymentStatusColors[st] || '';
                const isNextDue = nextUnpaid?.installmentNumber === p.installmentNumber;

                return (
                  <tr key={p.id} className={isNextDue ? 'bg-gold-400/10' : ''}>
                    <td className="py-3 px-4 font-medium text-ivory">
                      {labelFor(p)}
                      {isNextDue && <span className="ml-2 text-xs text-gold-400 font-normal">{t('installments.nextLabel')}</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-mist">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-mist">
                      {new Date(p.dueDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {tOr(`status.installment.${st}`, st)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panduan Pembayaran */}
      <div className="bg-gold-400/10 border border-gold-500/30 rounded-xl p-5 text-sm text-gold-200">
        <h3 className="font-semibold mb-2">{t('installments.howManualTitle')}</h3>
        <ol className="list-decimal list-inside space-y-1.5 ml-1">
          <li>{t('installments.howManual1')}</li>
          <li>{t('installments.howManual2')}</li>
          <li>{t('installments.howManual3A')} <strong>{t('installments.howManual3B')}</strong>{t('installments.howManual3C')}</li>
        </ol>
        <p className="mt-3 text-xs text-gold-300">
          {t('installments.settlementNote')}
        </p>
      </div>
    </div>
  );
}
