'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tour {
  id: string;
  name: string;
  slug: string;
  category: string;
  destination: string;
  duration: string;
  priceAdult: number;
  coverImg: string | null;
  isActive: boolean;
  _count: { orders: number };
}

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTours(); }, []);

  const fetchTours = async () => {
    try {
      const res = await fetch('/api/admin/tours');
      const data = await res.json();
      if (data.success) setTours(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus paket "${name}"?`)) return;
    try {
      await fetch(`/api/admin/tours/${id}`, { method: 'DELETE' });
      fetchTours();
    } catch (err) { console.error(err); }
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paket Tour</h1>
        <Link href="/admin/tours/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
          + Tambah Paket
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nama Paket</th>
                <th className="px-4 py-3 text-left font-medium">Kategori</th>
                <th className="px-4 py-3 text-left font-medium">Destinasi</th>
                <th className="px-4 py-3 text-left font-medium">Durasi</th>
                <th className="px-4 py-3 text-right font-medium">Harga</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Booking</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {tour.coverImg ? (
                          <img
                            src={tour.coverImg}
                            alt={tour.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🏝️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tour.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{tour.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tour.category.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{tour.destination}</td>
                  <td className="px-4 py-3">{tour.duration}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(tour.priceAdult)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tour.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{tour._count.orders}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                      <Link href={`/admin/tours/${tour.id}/edit`} className="text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap">Edit</Link>
                      <Link href={`/admin/tours/${tour.id}/gallery`} className="text-green-600 hover:text-green-700 text-xs whitespace-nowrap">Foto</Link>
                      <Link href={`/admin/tours/${tour.id}/schedule`} className="text-purple-600 hover:text-purple-700 text-xs whitespace-nowrap">Jadwal</Link>
                      <button onClick={() => handleDelete(tour.id, tour.name)} className="text-red-600 hover:text-red-700 text-xs whitespace-nowrap">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {tours.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Belum ada paket tour</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
