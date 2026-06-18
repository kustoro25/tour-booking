'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

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

const ITEMS_PER_PAGE = 6;

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { fetchTours(); }, []);

  const fetchTours = async () => {
    try {
      const res = await fetch('/api/admin/tours');
      const data = await res.json();
      if (data.success) setTours(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tours/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTours(tours.filter(t => t.id !== deleteTarget.id));
        showToast(`"${deleteTarget.name}" berhasil dihapus`, 'success');
      } else {
        showToast(data.error || 'Gagal menghapus', 'error');
      }
    } catch { showToast('Terjadi kesalahan', 'error'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const filteredTours = useMemo(() => {
    let result = tours;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
    }
    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }
    return result;
  }, [tours, search, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedTours = filteredTours.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Hapus Paket?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              &quot;{deleteTarget.name}&quot; akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paket Tour</h1>
        <Link href="/admin/tours/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap transition-colors">
          + Tambah Paket
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama paket atau destinasi..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Semua Kategori</option>
          {(Object.keys(TourCategoryLabels) as TourCategory[]).map(cat => (
            <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>
          ))}
        </select>
      </div>

      {/* Tour Grid */}
      {paginatedTours.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🏝️</div>
          <p className="text-gray-500">Belum ada paket tour{search || filterCategory ? ' yang cocok dengan filter' : ''}</p>
          {!search && !filterCategory && (
            <Link href="/admin/tours/create" className="inline-block mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">+ Tambah paket pertama</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedTours.map(tour => (
            <div key={tour.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-40 bg-gray-200 overflow-hidden">
                {tour.coverImg ? (
                  <Image src={tour.coverImg} alt={tour.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🏝️</div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tour.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-medium text-gray-700">
                  {tour._count.orders} booking
                </div>
              </div>

              <div className="p-4">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {TourCategoryLabels[tour.category as TourCategory] || tour.category}
                </span>
                <h3 className="mt-2 font-semibold text-gray-900 line-clamp-1">{tour.name}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span>📍</span> {tour.destination}</span>
                  <span className="flex items-center gap-1"><span>🕒</span> {tour.duration}</span>
                </div>
                <p className="mt-2 font-bold text-gray-900">{formatCurrency(tour.priceAdult)}</p>
              </div>

              <div className="px-4 pb-4 flex items-center gap-1">
                <Link href={`/admin/tours/${tour.id}/edit`} title="Edit" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <Link href={`/admin/tours/${tour.id}/gallery`} title="Galeri" className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
                <Link href={`/admin/tours/${tour.id}/schedule`} title="Jadwal" className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
                <div className="flex-1" />
                <button onClick={() => setDeleteTarget(tour)} title="Hapus" className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  );
}
