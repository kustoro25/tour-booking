'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatusLabels, OrderStatusColors } from '@/types';
import type { OrderStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface Booking {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tourDate: string;
  adults: number;
  children: number;
  total: number;
  status: string;
  createdAt: string;
  tour: { name: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/bookings?status=${statusFilter}` : '/api/admin/bookings';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string, invoiceNo: string) => {
    if (!confirm(`Hapus booking ${invoiceNo}?\n\nTindakan ini tidak dapat dibatalkan. Semua data terkait (invoice, review) juga akan dihapus.`)) return;
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      } else {
        alert(data.error || 'Gagal menghapus booking');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus booking');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBookings();
    } catch (err) { console.error(err); }
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Semua Booking</h1>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            {s || 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Invoice</th>
                  <th className="px-4 py-3 text-left font-medium">Tamu</th>
                  <th className="px-4 py-3 text-left font-medium">Paket</th>
                  <th className="px-4 py-3 text-left font-medium">Tgl Tour</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{b.invoiceNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-gray-500">{b.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.tour.name}</td>
                    <td className="px-4 py-3">{formatDate(b.tourDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(b.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={b.status}
                        onChange={e => handleStatusUpdate(b.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {Object.keys(OrderStatusLabels).map(s => <option key={s} value={s}>{OrderStatusLabels[s as OrderStatus]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/admin/bookings/${b.id}`} className="text-blue-600 hover:text-blue-700 text-xs">Detail</Link>
                        <button
                          onClick={() => handleDelete(b.id, b.invoiceNo)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada booking</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
