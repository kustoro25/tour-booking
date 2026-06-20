'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatusLabels, OrderStatusColors } from '@/types';
import type { OrderStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAdminRole } from '@/lib/useAdminRole';

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
  const { isSuperAdmin, role } = useAdminRole();
  const canManageBookings = isSuperAdmin || role === 'ADMIN';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; invoiceNo: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const { showToast } = useToast();

  const handleBlocked = () => {
    setShowBlocked(true);
    setTimeout(() => setShowBlocked(false), 3000);
  };

  const blockedMessage = role === 'CONTENT_MANAGER'
    ? '🚫 Hanya Super Admin & Admin Operasional yang bisa mengelola booking.'
    : '🚫 Hanya Super Admin yang bisa mengelola booking.';

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
        showToast(`Booking ${deleteTarget.invoiceNo} berhasil dihapus`, 'success');
      } else {
        showToast(data.error || 'Gagal menghapus booking', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus booking', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
      showToast('Status booking diperbarui', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui status', 'error');
    }
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-[scaleIn_0.2s_ease]">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Hapus Booking?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Booking <strong>{deleteTarget.invoiceNo}</strong> akan dihapus permanen. Semua data terkait (invoice, review) juga akan dihapus.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Semua Booking</h1>

      {showBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">{blockedMessage}</p>
        </div>
      )}

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
        <>
          {/* ═══════ Mobile Card View ═══════ */}
          <div className="sm:hidden space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">Tidak ada booking</div>
            ) : (
              bookings.map(b => (
                <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.customerName}</p>
                      <p className="text-xs text-gray-500 font-mono">{b.invoiceNo}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      b.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{b.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">Paket</span>
                      <p className="text-gray-700">{b.tour.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Tgl Tour</span>
                      <p className="text-gray-700">{formatDate(b.tourDate)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Peserta</span>
                      <p className="text-gray-700">{b.adults + b.children} orang</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Total</span>
                      <p className="text-gray-900 font-semibold">{formatCurrency(b.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <select
                      value={b.status}
                      onChange={e => canManageBookings ? handleStatusUpdate(b.id, e.target.value) : handleBlocked()}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 flex-1 bg-white"
                    >
                      {Object.keys(OrderStatusLabels).map(s => <option key={s} value={s}>{OrderStatusLabels[s as OrderStatus]}</option>)}
                    </select>
                    <Link href={`/admin/bookings/${b.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Detail</Link>
                    <button onClick={canManageBookings ? () => setDeleteTarget({ id: b.id, invoiceNo: b.invoiceNo }) : handleBlocked} className="text-red-500 hover:text-red-700 text-xs font-medium">Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ═══════ Desktop Table View ═══════ */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
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
                        onChange={e => canManageBookings ? handleStatusUpdate(b.id, e.target.value) : handleBlocked()}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {Object.keys(OrderStatusLabels).map(s => <option key={s} value={s}>{OrderStatusLabels[s as OrderStatus]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/admin/bookings/${b.id}`} className="text-blue-600 hover:text-blue-700 text-xs">Detail</Link>
                        <button
                          onClick={canManageBookings ? () => setDeleteTarget({ id: b.id, invoiceNo: b.invoiceNo }) : handleBlocked}
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
        </>
      )}
    </div>
  );
}
