'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import CopyButton from '@/components/ui/CopyButton';
import { InstallmentPaymentStatusLabels, InstallmentPaymentStatusColors, InstallmentPaymentStatusDots } from '@/types';
import type { InstallmentPaymentStatus } from '@/types';

interface Payment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: InstallmentPaymentStatus;
  paymentProof: string | null;
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
  const invoiceNo = params.invoice_no as string;

  const [data, setData] = useState<InstallmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
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
        }
      })
      .catch(() => {});
  }, []);

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
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{error || 'Data tidak ditemukan'}</h2>
        <Link href="/" className="text-blue-600 hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const { plan, payments, order } = data;
  const nextUnpaid = payments.find((p) => p.status === 'PENDING');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href={`/invoice/${invoiceNo}`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Kembali ke Invoice
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pembayaran Angsuran</h1>
      <p className="text-gray-500 text-sm mb-6">
        {order.tour.name} &bull; Invoice: {invoiceNo}
      </p>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400 text-xs">Total</span>
            <p className="font-semibold">{formatCurrency(plan.totalAmount)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">DP ({plan.dpPercentage}%)</span>
            <p className="font-semibold text-orange-600">{formatCurrency(plan.downPayment)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Angsuran</span>
            <p className="font-semibold">{plan.installmentCount}x @ {formatCurrency(plan.amountPerInstallment)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Status</span>
            <p className={`font-semibold ${plan.status === 'COMPLETED' ? 'text-green-600' : plan.status === 'CANCELLED' ? 'text-red-600' : 'text-blue-600'}`}>
              {plan.status === 'ACTIVE' ? 'Aktif' : plan.status === 'COMPLETED' ? 'Lunas' : 'Dibatalkan'}
            </p>
          </div>
        </div>
      </div>

      {/* Rekening Pembayaran */}
      {banks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800">Rekening Pembayaran</h3>
            <p className="text-xs text-blue-600 mt-0.5">
              Transfer ke salah satu rekening berikut, lalu unggah bukti transfer pada tabel di bawah.
            </p>
          </div>
          <div className="p-5 space-y-3">
            {banks.map((b) => (
              <div
                key={`${b.bank}-${b.number}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border border-gray-100 rounded-lg px-4 py-3"
              >
                <div>
                  <span className="font-semibold text-gray-800">{b.bank}</span>
                  <span className="text-gray-300 mx-2">•</span>
                  <span className="font-mono text-gray-700">{b.number}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{b.name}</p>
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
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {uploadMsg.text}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
          <h3 className="text-sm font-semibold text-orange-800">Jadwal Angsuran</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Angsuran</th>
                <th className="py-2.5 px-4 text-right font-medium">Jumlah</th>
                <th className="py-2.5 px-4 text-right font-medium">Jatuh Tempo</th>
                <th className="py-2.5 px-4 text-center font-medium">Status</th>
                <th className="py-2.5 px-4 text-center font-medium">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => {
                const st = p.status as InstallmentPaymentStatus;
                const dotColor = InstallmentPaymentStatusDots[st] || 'bg-gray-500';
                const colors = InstallmentPaymentStatusColors[st] || '';
                const isNextDue = nextUnpaid?.installmentNumber === p.installmentNumber;

                return (
                  <tr key={p.id} className={isNextDue ? 'bg-amber-50' : ''}>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      Angsuran ke-{p.installmentNumber}
                      {isNextDue && <span className="ml-2 text-xs text-orange-500 font-normal">(Berikutnya)</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
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
                          <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                            Lihat Bukti
                          </a>
                        )}
                        {p.status !== 'CONFIRMED' && (
                          <label
                            className={`text-xs font-medium transition-colors ${
                              uploadingNum === p.installmentNumber
                                ? 'text-gray-400 cursor-wait'
                                : 'text-orange-600 hover:text-orange-700 hover:underline cursor-pointer'
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">📤 Cara Membayar & Mengirim Bukti</h3>
        <ol className="list-decimal list-inside space-y-1.5 ml-1">
          <li>Transfer sesuai nominal angsuran ke salah satu <strong>rekening perusahaan</strong> di atas.</li>
          <li>Unggah bukti transfer melalui tombol <strong>Unggah Bukti</strong> pada baris angsuran di tabel.</li>
          <li>Admin akan memverifikasi dalam 1×24 jam — status berubah menjadi <strong>Terkonfirmasi</strong>.</li>
        </ol>
        <p className="mt-3 text-xs text-blue-600">
          Alternatif: kirim bukti melalui WhatsApp {companyPhone || 'admin'} atau email {companyEmail || 'yang tertera pada invoice'}.
          Pembayaran angsuran dilakukan via transfer bank; khusus pembayaran lunas, tersedia pembayaran online (QRIS / Virtual Account / e-wallet / kartu) melalui halaman invoice.
        </p>
      </div>
    </div>
  );
}
