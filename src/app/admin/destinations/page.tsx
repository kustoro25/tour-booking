'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await fetch('/api/admin/destinations');
      const data = await res.json();
      if (data.success) setDestinations(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus destinasi "${name}"?`)) return;
    try {
      await fetch(`/api/admin/destinations/${id}`, { method: 'DELETE' });
      fetchDestinations();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola halaman destinasi wisata</p>
        </div>
        <Link
          href="/admin/destinations/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
        >
          + Tambah Destinasi
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nama</th>
                <th className="px-4 py-3 text-left font-medium">Lokasi</th>
                <th className="px-4 py-3 text-center font-medium">Rating</th>
                <th className="px-4 py-3 text-center font-medium">Paket</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Unggulan</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {destinations.map((dest: Record<string, unknown>) => (
                <tr key={dest.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {dest.imageUrl ? (
                          <img
                            src={dest.imageUrl as string}
                            alt={dest.name as string}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dest.name as string}</p>
                        <p className="text-xs text-gray-400 font-mono">{dest.slug as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{dest.location as string}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-medium">
                      ⭐ {Number(dest.rating).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(dest._count as any)?.tours || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        dest.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {dest.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {dest.highlight ? '⭐' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                      <Link
                        href={`/admin/destinations/${dest.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 text-xs whitespace-nowrap"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(dest.id as string, dest.name as string)}
                        className="text-red-600 hover:text-red-700 text-xs whitespace-nowrap"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {destinations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada destinasi. Klik &quot;+ Tambah Destinasi&quot; untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
