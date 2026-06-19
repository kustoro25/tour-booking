'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { UserRoleLabels, type UserRole } from '@/types';
import { useAdminRole } from '@/lib/useAdminRole';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAdminRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const { showToast } = useToast();

  const handleBlocked = () => {
    setShowBlocked(true);
    setTimeout(() => setShowBlocked(false), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.error || 'Gagal memuat data');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        showToast(`Admin "${deleteTarget.name}" berhasil dihapus`, 'success');
      } else {
        showToast(data.error || 'Gagal menghapus', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus admin', 'error');
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

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    CONTENT_MANAGER: 'bg-green-100 text-green-700',
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
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
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Hapus Admin?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Admin <strong>&quot;{deleteTarget.name}&quot;</strong> akan dihapus permanen.
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola akun admin dan role-nya (Super Admin only)</p>
        </div>
        {isSuperAdmin ? (
          <Link
            href="/admin/users/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Tambah Admin
          </Link>
        ) : (
          <button
            onClick={handleBlocked}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Tambah Admin
          </button>
        )}
      </div>

      {showBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">🚫 Hanya Super Admin yang bisa menambah admin baru.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* ═══════ Role Permissions Info ═══════ */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📋</span>
          Hak Akses Per Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Super Admin */}
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Super Admin</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Akses penuh ke semua menu</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Tambah, edit, hapus paket tour & destinasi</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Kelola booking (ubah status & hapus)</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Approve/hide review</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Tambah & hapus admin</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Ubah pengaturan website</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Edit halaman CMS</li>
            </ul>
          </div>

          {/* Admin Operasional */}
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Admin Operasional</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Tambah, edit, hapus paket tour & destinasi</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Kelola booking (ubah status & hapus)</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Approve/hide review</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Kelola blog</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Tambah/hapus admin</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Ubah pengaturan website</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Simpan perubahan halaman CMS</li>
            </ul>
          </div>

          {/* Content Manager */}
          <div className="border border-green-200 rounded-xl p-4 bg-green-50/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Content Manager</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Edit paket tour & destinasi</li>
              <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✅</span> Kelola blog</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Tambah/hapus paket tour & destinasi</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Kelola booking</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Kelola review</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Tambah/hapus admin</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Ubah pengaturan website</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">❌</span> Simpan perubahan halaman CMS</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* ═══════ Mobile Card View ═══════ */}
        <div className="sm:hidden divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada admin</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    {UserRoleLabels[user.role]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{user.phone || '-'}</span>
                  <span>·</span>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  {isSuperAdmin ? (
                    <button onClick={() => setDeleteTarget({ id: user.id, name: user.name })} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
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
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Telepon</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Bergabung</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{user.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {UserRoleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                  {isSuperAdmin ? (
                    <button
                      onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      onClick={handleBlocked}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Hapus
                    </button>
                  )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada admin
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
