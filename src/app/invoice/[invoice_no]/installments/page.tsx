'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
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

export default function InstallmentTrackingPage() {
  const params = useParams();
  const invoiceNo = params.invoice_no as string;

  const [data, setData] = useState<InstallmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    fetch(`/api/installments/${invoiceNo}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Gagal memuat data');
      })
      .catch(() => setError('Gagal menghubungi server'))
      .finally(() => setLoading(false));
  }, [invoiceNo]);

  const handleUpload = async (installmentNumber: number) => {
    if (!proofUrl.trim()) {
      setUploadMsg('Masukkan URL bukti transfer');
      return;
    }
    setUploading(installmentNumber);
    setUploadMsg('');
    try {
      const res = await fetch(`/api/installments/${invoiceNo}/pay/${installmentNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProof: proofUrl }),
      });
      const d = await res.json();
      if (d.success) {
        setUploadMsg(d.message);
        setProofUrl('');
        // Refresh data
        const refresh = await fetch(`/api/installments/${invoiceNo}`);
        const refreshData = await refresh.json();
        if (refreshData.success) setData(refreshData.data);
      } else {
        setUploadMsg(d.error || 'Gagal mengunggah');
      }
    } catch {
      setUploadMsg('Gagal menghubungi server');
    } finally {
      setUploading(null);
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
                <th className="py-2.5 px-4 text-center font-medium">Aksi</th>
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
                      {p.paymentProof && (
                        <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                          Lihat Bukti
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Section */}
      {nextUnpaid && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Bukti Transfer - Angsuran ke-{nextUnpaid.installmentNumber}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Jumlah: <strong className="text-gray-800">{formatCurrency(nextUnpaid.amount)}</strong> &bull;
            Jatuh Tempo: <strong className="text-orange-600">
              {new Date(nextUnpaid.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </p>

          {uploadMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${uploadMsg.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {uploadMsg}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Bukti Transfer</label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/file/... atau https://i.imgur.com/..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload bukti transfer ke Google Drive, Imgur, atau layanan gambar lainnya, lalu tempel URL-nya di sini.
              </p>
            </div>
            <button
              onClick={() => handleUpload(nextUnpaid.installmentNumber)}
              disabled={uploading !== null}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 text-sm transition-colors"
            >
              {uploading ? 'Mengunggah...' : 'Upload Bukti Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
