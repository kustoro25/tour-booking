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

      {/* Upload Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">📤 Cara Mengirim Bukti Transfer</h3>
        <p className="mb-2">Kirimkan bukti transfer Anda melalui:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li><strong>Email:</strong> Kirim ke alamat email yang tertera di invoice</li>
          <li><strong>WhatsApp:</strong> Kirim ke nomor WhatsApp admin yang tertera di invoice</li>
        </ul>
        <p className="mt-3 text-xs text-blue-600">Setelah admin menerima dan memverifikasi bukti transfer, status pembayaran akan diperbarui dan bukti akan muncul di tabel di atas.</p>
      </div>
    </div>
  );
}
