'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderStatusLabels } from '@/types';
import type { OrderStatus } from '@/types';

export default function BookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setBooking(data.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setBooking(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" /></div>;
  if (!booking) return <div className="text-center py-12 text-gray-500">Booking tidak ditemukan</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bookings" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Detail Booking</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-500">Nomor Invoice</p>
            <p className="text-xl font-bold text-blue-600">{booking.invoiceNo as string}</p>
          </div>
          <div>
            <select
              value={booking.status as string}
              onChange={e => handleStatusUpdate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.keys(OrderStatusLabels).map(s => <option key={s} value={s}>{OrderStatusLabels[s as OrderStatus]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nama Tamu</p>
            <p className="font-medium">{booking.customerName as string}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-sm">{booking.customerEmail as string}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">No. HP</p>
            <p className="font-medium">{booking.customerPhone as string}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paket Tour</p>
            <p className="font-medium">{(booking.tour as { name: string })?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Tour</p>
            <p className="font-medium">{new Date(booking.tourDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jumlah Peserta</p>
            <p className="font-medium">{booking.adults as number} Dewasa{(booking.children as number) > 0 ? `, ${booking.children} Anak` : ''}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-lg text-blue-600">{formatCurrency(booking.total as number)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Booking</p>
            <p className="font-medium">{new Date(booking.createdAt as string).toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {booking.notes ? (
          <div>
            <p className="text-sm text-gray-500">Catatan Tamu</p>
            <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{String(booking.notes)}</p>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Link href={`/invoice/${booking.invoiceNo}`} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Lihat Invoice</Link>
        </div>
      </div>
    </div>
  );
}
