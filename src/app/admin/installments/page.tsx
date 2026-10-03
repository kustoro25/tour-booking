'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { InstallmentPlanStatusLabels, InstallmentPlanStatusColors } from '@/types';
import type { InstallmentPlanStatus } from '@/types';

interface AdminInstallmentOrder {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  total: number;
  tour: { name: string };
  installmentPlan: {
    id: string;
    status: string;
    installmentCount: number;
    amountPerInstallment: number;
    payments?: { installmentNumber: number; status: string }[];
  } | null;
}

export default function AdminInstallmentsPage() {
  const [orders, setOrders] = useState<AdminInstallmentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/installments')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Angsuran</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pembayaran Angsuran</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          Belum ada pesanan dengan pembayaran angsuran
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {orders.map((order) => {
              const plan = order.installmentPlan;
              if (!plan) return null;
              const paidCount = plan.payments?.filter((p) => p.installmentNumber >= 1 && p.status === 'CONFIRMED').length || 0;
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.customerName}</p>
                      <p className="text-xs text-gray-500 font-mono">{order.invoiceNo}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${InstallmentPlanStatusColors[plan.status as InstallmentPlanStatus]}`}>
                      {InstallmentPlanStatusLabels[plan.status as InstallmentPlanStatus]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">Paket</span>
                      <p className="text-gray-700">{order.tour.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Total</span>
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Angsuran</span>
                      <p className="text-gray-700">{plan.installmentCount}x @ {formatCurrency(plan.amountPerInstallment)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Terbayar</span>
                      <p className={`font-semibold ${paidCount === plan.installmentCount ? 'text-green-600' : 'text-orange-600'}`}>
                        {paidCount}/{plan.installmentCount}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/installments/${plan.id}`} className="block text-center text-blue-600 text-sm font-medium hover:underline">
                    Kelola Angsuran →
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium">Tamu</th>
                    <th className="px-4 py-3 text-left font-medium">Paket</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Angsuran</th>
                    <th className="px-4 py-3 text-center font-medium">Terbayar</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const plan = order.installmentPlan;
                    if (!plan) return null;
                    const paidCount = plan.payments?.filter((p) => p.installmentNumber >= 1 && p.status === 'CONFIRMED').length || 0;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{order.invoiceNo}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{order.tour.name}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-center">{plan.installmentCount}x @ {formatCurrency(plan.amountPerInstallment)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={paidCount === plan.installmentCount ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                            {paidCount}/{plan.installmentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${InstallmentPlanStatusColors[plan.status as InstallmentPlanStatus]}`}>
                            {InstallmentPlanStatusLabels[plan.status as InstallmentPlanStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/admin/installments/${plan.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                            Kelola
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
