'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import CopyButton from '@/components/ui/CopyButton';
import { InstallmentPaymentStatusLabels, InstallmentPaymentStatusColors, InstallmentPaymentStatusDots } from '@/types';
import type { InstallmentPaymentStatus } from '@/types';

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
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceNo = params.invoice_no as string;

  const [data, setData] = useState<InstallmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [gateway, setGateway] = useState<'midtrans' | 'manual'>('manual');
  const [payNoticeDismissed, setPayNoticeDismissed] = useState(false);
  const [uploadingNum, setUploadingNum] = useState<number | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(() => {
    return fetch(`/api/installments/${invoiceNo}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Gagal memuat data');
      })
      .catch(() => setError('Gagal menghubungi server'));
  }, [invoiceNo]);

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
          if (res.data.paymentGateway === 'midtrans') setGateway('midtrans');
        }
      })
      .catch(() => {});
  }, []);

  // Notifikasi hasil pembayaran online (kembali dari halaman Midtrans) — dari query param
  const payParam = searchParams.get('pay');
  const payNotice: 'finish' | 'failed' | null =
    !payNoticeDismissed && (payParam === 'finish' || payParam === 'failed') ? payParam : null;

  const handleUploadProof = async (installmentNumber: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadMsg({ type: 'error', text: 'File harus berupa gambar (JPG, PNG, atau WebP).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg({ type: 'error', text: 'Ukuran file maksimal 10MB.' });
      return;
    }
    setUploadMsg(null);
    setUploadingNum(installmentNumber);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'tour-booking/installment-proofs');
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upRes = await up.json();
      if (!upRes.success || !upRes.url) throw new Error(upRes.error || 'Gagal mengunggah gambar');

      const res = await fetch(`/api/installments/${invoiceNo}/pay/${installmentNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProof: upRes.url }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menyimpan bukti transfer');

      setUploadMsg({ type: 'success', text: `Bukti angsuran ke-${installmentNumber} berhasil diunggah. Menunggu konfirmasi admin.` });
      await fetchData();
    } catch (e) {
      setUploadMsg({ type: 'error', text: e instanceof Error ? e.message : 'Gagal mengunggah bukti transfer' });
    } finally {
      setUploadingNum(null);
    }
  };

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
        <h2 className="text-2xl font-bold text-mist mb-2">{error || 'Data tidak ditemukan'}</h2>
        <Link href="/" className="text-gold-300 hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const { plan, payments, order } = data;
  const isOnline = gateway === 'midtrans';
  const dpPayment = payments.find((p) => p.installmentNumber === 0);
  const nextUnpaid = payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const labelFor = (p: Payment) =>
    p.installmentNumber === 0 ? `DP ${plan.dpPercentage}% (Uang Muka)` : `Angsuran ke-${p.installmentNumber}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href={`/invoice/${invoiceNo}`} className="text-gold-300 hover:underline text-sm mb-4 inline-block">
        ← Kembali ke Invoice
      </Link>

      <h1 className="text-2xl font-bold text-ivory mb-1">Pembayaran Angsuran</h1>
      <p className="text-mist-dim text-sm mb-6">
        {order.tour.name} &bull; Invoice: {invoiceNo}
      </p>

      {/* Notifikasi hasil pembayaran online */}
      {payNotice && (
        <div
          className={`rounded-xl p-4 mb-6 text-sm border ${
            payNotice === 'finish'
              ? 'bg-gold-400/10 border-gold-500/30 text-gold-200'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {payNotice === 'finish' ? (
            <span>
              💳 Pembayaran Anda sedang diproses otomatis. Status akan diperbarui dalam beberapa saat —
              klik{' '}
              <button
                onClick={() => {
                  fetchData();
                  setPayNoticeDismissed(true);
                  window.history.replaceState({}, '', `/invoice/${invoiceNo}/installments`);
                }}
                className="font-semibold underline"
              >
                muat ulang status
              </button>{' '}
              bila belum berubah.
            </span>
          ) : (
            <span>
              Pembayaran belum selesai atau dibatalkan. Silakan coba lagi melalui tombol{' '}
              <strong>Bayar Online</strong> pada tabel di bawah.
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-ink-850 rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-mist-dim text-xs">Total</span>
            <p className="font-semibold">{formatCurrency(plan.totalAmount)}</p>
          </div>
          <div>
            <span className="text-mist-dim text-xs">DP ({plan.dpPercentage}%)</span>
            <p className="font-semibold text-gold-300">{formatCurrency(plan.downPayment)}</p>
            {dpPayment && (
              <span className={`text-[10px] font-medium ${dpPayment.status === 'CONFIRMED' ? 'text-emerald-300' : 'text-gold-300'}`}>
                {dpPayment.status === 'CONFIRMED' ? '✓ Lunas' : 'Menunggu'}
              </span>
            )}
          </div>
          <div>
            <span className="text-mist-dim text-xs">Angsuran</span>
            <p className="font-semibold">{plan.installmentCount}x @ {formatCurrency(plan.amountPerInstallment)}</p>
          </div>
          <div>
            <span className="text-mist-dim text-xs">Status</span>
            <p className={`font-semibold ${plan.status === 'COMPLETED' ? 'text-green-300' : plan.status === 'CANCELLED' ? 'text-red-300' : 'text-gold-300'}`}>
              {plan.status === 'ACTIVE' ? 'Aktif' : plan.status === 'COMPLETED' ? 'Lunas' : 'Dibatalkan'}
            </p>
          </div>
        </div>
      </div>

      {/* Info pembayaran online */}
      {isOnline && (
        <div className="bg-gold-400/10 border border-gold-500/30 rounded-xl p-4 mb-6 text-sm text-gold-200">
          <p className="font-semibold mb-1">💳 Pembayaran Online (Otomatis)</p>
          <p className="text-xs text-gold-300 leading-relaxed">
            Bayar melalui halaman pembayaran aman <strong>Midtrans</strong> — QRIS, Virtual Account berbagai bank,
            e-wallet (GoPay, ShopeePay, DANA), atau kartu kredit/debit. Setiap pembayaran
            <strong> terkonfirmasi otomatis</strong> — tidak perlu upload bukti atau konfirmasi admin.
          </p>
        </div>
      )}

      {/* Rekening Pembayaran (mode transfer manual) */}
      {!isOnline && banks.length > 0 && (
        <div className="bg-ink-850 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3 bg-gold-400/10 border-b border-gold-500/20">
            <h3 className="text-sm font-semibold text-gold-200">Rekening Pembayaran</h3>
            <p className="text-xs text-gold-300 mt-0.5">
              Transfer ke salah satu rekening berikut, lalu unggah bukti transfer pada tabel di bawah.
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

      {/* Pesan upload */}
      {uploadMsg && (
        <div
          className={`rounded-xl p-4 mb-4 text-sm border ${
            uploadMsg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {uploadMsg.text}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-ink-850 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-gold-400/10 border-b border-orange-100">
          <h3 className="text-sm font-semibold text-orange-800">Jadwal Angsuran</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-mist-dim text-xs">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Angsuran</th>
                <th className="py-2.5 px-4 text-right font-medium">Jumlah</th>
                <th className="py-2.5 px-4 text-right font-medium">Jatuh Tempo</th>
                <th className="py-2.5 px-4 text-center font-medium">Status</th>
                <th className="py-2.5 px-4 text-center font-medium">{isOnline ? 'Pembayaran' : 'Bukti'}</th>
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
                      {isNextDue && <span className="ml-2 text-xs text-gold-400 font-normal">(Berikutnya)</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-mist">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-mist">
                      {new Date(p.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {InstallmentPaymentStatusLabels[st]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {p.paymentProof && (
                          <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:underline text-xs">
                            Lihat Bukti
                          </a>
                        )}
                        {isOnline ? (
                          p.status !== 'CONFIRMED' ? (
                            <a
                              href={`/api/installments/${invoiceNo}/pay/${p.installmentNumber}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-400 text-ink-950 text-xs font-semibold hover:bg-gold-300 transition-colors whitespace-nowrap"
                            >
                              💳 Bayar Online
                            </a>
                          ) : (
                            <span className="text-[10px] text-mist-dim">
                              {p.paymentMethod ? `via ${p.paymentMethod.replace(/_/g, ' ')}` : 'Online'}
                            </span>
                          )
                        ) : (
                          p.status !== 'CONFIRMED' && (
                            <label
                              className={`text-xs font-medium transition-colors ${
                                uploadingNum === p.installmentNumber
                                  ? 'text-mist-dim cursor-wait'
                                  : 'text-gold-300 hover:text-gold-300 hover:underline cursor-pointer'
                              }`}
                            >
                              {uploadingNum === p.installmentNumber
                                ? 'Mengunggah…'
                                : p.paymentProof
                                  ? 'Ganti Bukti'
                                  : 'Unggah Bukti'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingNum !== null}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadProof(p.installmentNumber, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )
                        )}
                      </div>
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
        {isOnline ? (
          <>
            <h3 className="font-semibold mb-2">💳 Cara Membayar (Online &amp; Otomatis)</h3>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Klik tombol <strong>Bayar Online</strong> pada baris DP / angsuran yang ingin dibayar.</li>
              <li>Pilih metode pembayaran di halaman aman <strong>Midtrans</strong> — QRIS, Virtual Account, e-wallet, atau kartu.</li>
              <li>Status pembayaran <strong>terkonfirmasi otomatis</strong> — tidak perlu upload bukti atau konfirmasi ke admin.</li>
            </ol>
            <p className="mt-3 text-xs text-gold-300">
              Link pembayaran berlaku 24 jam dan dapat dibuat ulang kapan saja. Ada kendala? Hubungi WhatsApp{' '}
              {companyPhone || 'admin'} atau email {companyEmail || 'yang tertera pada invoice'}.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-semibold mb-2">📤 Cara Membayar &amp; Mengirim Bukti</h3>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Transfer sesuai nominal angsuran ke salah satu <strong>rekening perusahaan</strong> di atas.</li>
              <li>Unggah bukti transfer melalui tombol <strong>Unggah Bukti</strong> pada baris angsuran di tabel.</li>
              <li>Admin akan memverifikasi dalam 1×24 jam — status berubah menjadi <strong>Terkonfirmasi</strong>.</li>
            </ol>
            <p className="mt-3 text-xs text-gold-300">
              Alternatif: kirim bukti melalui WhatsApp {companyPhone || 'admin'} atau email {companyEmail || 'yang tertera pada invoice'}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
