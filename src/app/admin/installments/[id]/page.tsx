'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  InstallmentPlanStatusLabels,
  InstallmentPlanStatusColors,
  InstallmentPaymentStatusLabels,
  InstallmentPaymentStatusColors,
  InstallmentPaymentStatusDots,
} from '@/types';
import type { InstallmentPlanStatus, InstallmentPaymentStatus } from '@/types';

export default function AdminInstallmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();

  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPlan = useCallback(() => {
    fetch(`/api/admin/installments/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPlan(data.data);
        else showToast(data.error || 'Gagal memuat data', 'error');
      })
      .catch(() => showToast('Gagal memuat data', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleConfirm = async (installmentNumber: number) => {
    if (!confirm(`Konfirmasi pembayaran angsuran ke-${installmentNumber}?`)) return;
    setActionLoading(installmentNumber);
    try {
      const res = await fetch(`/api/admin/installments/${id}/confirm/${installmentNumber}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Pembayaran dikonfirmasi', 'success');
        fetchPlan();
      } else {
        showToast(data.error || 'Gagal konfirmasi', 'error');
      }
    } catch {
      showToast('Gagal konfirmasi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBilling = async (installmentNumber: number) => {
    if (!confirm(`Kirim penagihan angsuran ke-${installmentNumber} ke email pelanggan?`)) return;
    setActionLoading(installmentNumber);
    try {
      const res = await fetch(`/api/admin/installments/${id}/send-billing/${installmentNumber}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Penagihan terkirim', 'success');
        fetchPlan();
      } else {
        showToast(data.error || 'Gagal mengirim penagihan', 'error');
      }
    } catch {
      showToast('Gagal mengirim penagihan', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Ubah status rencana angsuran menjadi "${InstallmentPlanStatusLabels[newStatus as InstallmentPlanStatus]}"?`)) return;
    try {
      const res = await fetch(`/api/admin/installments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Status berhasil diubah', 'success');
        fetchPlan();
      } else {
        showToast(data.error || 'Gagal mengubah status', 'error');
      }
    } catch {
      showToast('Gagal mengubah status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return <div className="text-center py-12 text-gray-500">Data angsuran tidak ditemukan</div>;
  }

  const order = plan.order as Record<string, unknown> | undefined;
  const payments = (plan.payments as Array<Record<string, unknown>>) || [];
  const paidCount = payments.filter((p) => p.status === 'CONFIRMED').length;
  const totalCount = (plan.installmentCount as number) || 0;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/installments" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
          <h1 className="text-2xl font-bold text-gray-900">Detail Angsuran</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status Plan:</span>
          <select
            value={plan.status as string}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm font-medium ${InstallmentPlanStatusColors[plan.status as InstallmentPlanStatus]}`}
          >
            {Object.keys(InstallmentPlanStatusLabels).map((s) => (
              <option key={s} value={s}>{InstallmentPlanStatusLabels[s as InstallmentPlanStatus]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Harga</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.totalAmount as number)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Down Payment</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(plan.downPayment as number)}</p>
          <p className="text-xs text-gray-400">{(plan.dpPercentage as number)}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Per Angsuran</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.amountPerInstallment as number)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <p className={`text-lg font-bold ${paidCount === totalCount ? 'text-emerald-600' : 'text-orange-600'}`}>
            {paidCount} / {totalCount}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Order Info */}
      {order && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Informasi Pesanan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Invoice</p>
              <p className="font-mono font-medium">{order.invoiceNo as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Nama Tamu</p>
              <p className="font-medium">{order.customerName as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-xs">{order.customerEmail as string}</p>
            </div>
            <div>
              <p className="text-gray-500">No. HP</p>
              <p className="font-medium">{order.customerPhone as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Paket Tour</p>
              <p className="font-medium">{(order.tour as Record<string, unknown>)?.name as string}</p>
            </div>
            <div>
              <p className="text-gray-500">Tanggal Tour</p>
              <p className="font-medium">{order.tourDate ? new Date(order.tourDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Daftar Angsuran</h2>
          <Link
            href={`/invoice/${order?.invoiceNo}/installments`}
            target="_blank"
            className="text-xs text-blue-600 hover:underline"
          >
            Halaman Publik ↗
          </Link>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {payments.map((payment, idx) => {
            const num = payment.installmentNumber as number;
            const status = payment.status as InstallmentPaymentStatus;
            const isDp = num === 0;
            const isLoadingMe = actionLoading === num;
            return (
              <div key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {isDp ? 'Down Payment' : `Angsuran ke-${num}`}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${InstallmentPaymentStatusColors[status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${InstallmentPaymentStatusDots[status]}`} />
                    {InstallmentPaymentStatusLabels[status]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">Jumlah</span>
                    <p className="font-medium">{formatCurrency(payment.amount as number)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Jatuh Tempo</span>
                    <p className={`text-sm ${status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}`}>
                      {payment.dueDate ? new Date(payment.dueDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
                {Boolean(payment.paymentProof) && (
                  <a
                    href={payment.paymentProof as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-600 hover:underline"
                  >
                    Lihat Bukti Transfer ↗
                  </a>
                )}
                <div className="flex gap-2 pt-1">
                  {(status === 'PAID') && (
                    <button
                      onClick={() => handleConfirm(num)}
                      disabled={isLoadingMe}
                      className="flex-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isLoadingMe ? '...' : 'Konfirmasi Bayar'}
                    </button>
                  )}
                  {(status === 'PENDING' || status === 'OVERDUE') && (
                    <button
                      onClick={() => handleSendBilling(num)}
                      disabled={isLoadingMe}
                      className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoadingMe ? '...' : 'Kirim Penagihan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {payments.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">Belum ada data angsuran</div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">No</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left font-medium">Jatuh Tempo</th>
                <th className="px-4 py-3 text-left font-medium">Bukti Transfer</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment, idx) => {
                const num = payment.installmentNumber as number;
                const status = payment.status as InstallmentPaymentStatus;
                const isDp = num === 0;
                const isLoadingMe = actionLoading === num;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{isDp ? 'DP' : `#${num}`}</span>
                      {isDp && <span className="text-xs text-gray-400 ml-1">(Down Payment)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${InstallmentPaymentStatusColors[status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${InstallmentPaymentStatusDots[status]}`} />
                        {InstallmentPaymentStatusLabels[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(payment.amount as number)}</td>
                    <td className="px-4 py-3">
                      <span className={status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}>
                        {payment.dueDate ? new Date(payment.dueDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.paymentProof ? (
                        <a
                          href={payment.paymentProof as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Lihat Bukti ↗
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {(status === 'PAID') && (
                          <button
                            onClick={() => handleConfirm(num)}
                            disabled={isLoadingMe}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoadingMe ? '...' : 'Konfirmasi'}
                          </button>
                        )}
                        {(status === 'PENDING' || status === 'OVERDUE') && (
                          <button
                            onClick={() => handleSendBilling(num)}
                            disabled={isLoadingMe}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoadingMe ? '...' : 'Kirim Tagihan'}
                          </button>
                        )}
                        {status === 'CONFIRMED' && (
                          <span className="text-xs text-emerald-600 font-medium">✓ Lunas</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada data angsuran</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
