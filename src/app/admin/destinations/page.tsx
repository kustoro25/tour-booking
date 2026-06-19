'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAdminRole } from '@/lib/useAdminRole';

export default function AdminDestinationsPage() {
  const { isSuperAdmin } = useAdminRole();
  const [destinations, setDestinations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const { showToast } = useToast();

  const handleBlocked = () => {
    setShowBlocked(true);
    setTimeout(() => setShowBlocked(false), 3000);
  };

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/destinations/${deleteTarget.id}`, { method: 'DELETE' });
      fetchDestinations();
      showToast(`Destinasi "${deleteTarget.name}" berhasil dihapus`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus destinasi', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Hapus Destinasi?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Destinasi <strong>&quot;{deleteTarget.name}&quot;</strong> akan dihapus permanen.
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola halaman destinasi wisata</p>
        </div>
        {isSuperAdmin ? (
          <Link
            href="/admin/destinations/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Tambah Destinasi
          </Link>
        ) : (
          <button
            onClick={handleBlocked}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Tambah Destinasi
          </button>
        )}
      </div>

      {showBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">🚫 Hanya Super Admin yang bisa menambah/menghapus destinasi.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* ═══════ Mobile Card View ═══════ */}
        <div className="sm:hidden divide-y divide-gray-100">
          {destinations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada destinasi. Klik "+ Tambah Destinasi" untuk menambah.</div>
          ) : (
            destinations.map((dest: Record<string, unknown>) => (
              <div key={dest.id as string} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative">
                    {dest.imageUrl ? (
                      <Image src={dest.imageUrl as string} alt={dest.name as string} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🗺️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{dest.name as string}</p>
                    <p className="text-xs text-gray-500">{dest.location as string}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">⭐ {Number(dest.rating).toFixed(1)}</span>
                  <span className="text-gray-300">|</span>
                  <span>{(dest._count as any)?.tours || 0} Paket</span>
                  <span className="text-gray-300">|</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${dest.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{dest.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  {dest.highlight ? <span className="ml-auto">⭐ Unggulan</span> : null}
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <Link href={`/admin/destinations/${dest.id}/edit`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</Link>
                  {isSuperAdmin ? (
                    <button onClick={() => setDeleteTarget({ id: dest.id as string, name: dest.name as string })} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
                  ) : (
                    <button onClick={handleBlocked} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ═══════ Desktop Table View ═══════ */}
        <div className="hidden sm:block">
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
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                        {dest.imageUrl ? (
                          <Image
                            src={dest.imageUrl as string}
                            alt={dest.name as string}
                            fill
                            className="object-cover"
                            sizes="40px"
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
                      {isSuperAdmin ? (
                        <button
                          onClick={() => setDeleteTarget({ id: dest.id as string, name: dest.name as string })}
                          className="text-red-600 hover:text-red-700 text-xs whitespace-nowrap"
                        >
                          Hapus
                        </button>
                      ) : (
                        <button
                          onClick={handleBlocked}
                          className="text-red-600 hover:text-red-700 text-xs whitespace-nowrap"
                        >
                          Hapus
                        </button>
                      )}
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
    </div>
  );
}
