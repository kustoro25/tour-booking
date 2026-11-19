'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRating from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAdminRole } from '@/lib/useAdminRole';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  status: string;
  photos: string;
  adminReply: string | null;
  createdAt: string;
  order: { customerName: string; invoiceNo: string };
  tour: { name: string };
}

const PER_PAGE = 10;

/** Parse kolom photos (JSON string) menjadi array URL yang aman. */
function parsePhotos(photos: string): string[] {
  try {
    const parsed = JSON.parse(photos);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.length > 0);
  } catch {
    return [];
  }
}

export default function AdminReviewsPage() {
  const { isSuperAdmin, role } = useAdminRole();
  const canManageReviews = isSuperAdmin || role === 'ADMIN';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showBlocked, setShowBlocked] = useState(false);

  // Balasan admin (inline per kartu review)
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const { showToast } = useToast();

  const handleBlocked = () => {
    setShowBlocked(true);
    setTimeout(() => setShowBlocked(false), 3000);
  };

  const blockedMessage = role === 'CONTENT_MANAGER'
    ? '🚫 Hanya Super Admin & Admin Operasional yang bisa mengelola review.'
    : '🚫 Hanya Super Admin yang bisa mengelola review.';

  const loadReviews = useCallback(async (): Promise<Review[] | null> => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        return data.data || [];
      }
    } catch (err) { console.error(err); }
    return null;
  }, [statusFilter, page]);

  useEffect(() => {
    let cancelled = false;
    loadReviews().then((result) => {
      if (cancelled) return;
      if (result) setReviews(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadReviews]);

  const refreshReviews = async () => {
    setLoading(true);
    const result = await loadReviews();
    if (result) setReviews(result);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Review disetujui dan tampil di situs publik', 'success');
        refreshReviews();
      } else {
        showToast(data.error || 'Gagal menyetujui review', 'error');
      }
    } catch {
      showToast('Gagal menyetujui review', 'error');
    }
  };

  const handleHide = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'HIDDEN' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Review disembunyikan dari situs publik', 'success');
        refreshReviews();
      } else {
        showToast(data.error || 'Gagal menyembunyikan review', 'error');
      }
    } catch {
      showToast('Gagal menyembunyikan review', 'error');
    }
  };

  const openReply = (review: Review) => {
    setReplyTarget(review.id);
    setReplyText(review.adminReply || '');
  };

  const handleSaveReply = async () => {
    if (!replyTarget) return;
    setReplySaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${replyTarget}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(replyText.trim() ? 'Balasan admin disimpan' : 'Balasan admin dihapus', 'success');
        setReplyTarget(null);
        setReplyText('');
        refreshReviews();
      } else {
        showToast(data.error || 'Gagal menyimpan balasan', 'error');
      }
    } catch {
      showToast('Gagal menyimpan balasan', 'error');
    } finally {
      setReplySaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Review</h1>
        <span className="text-sm text-gray-500">{total} review</span>
      </div>

      {showBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">{blockedMessage}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'PENDING', 'APPROVED', 'HIDDEN'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setLoading(true); }} className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
            {s || 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const photos = parsePhotos(review.photos);
            const replyOpen = replyTarget === review.id;
            return (
              <div key={review.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        review.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{review.reviewText}</p>

                    {/* Foto review */}
                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {photos.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" title="Buka foto">
                            {/* eslint-disable-next-line @next/next/no-img-element -- foto review dari upload Cloudinary */}
                            <img src={url} alt="Foto review" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>👤 {review.order.customerName}</span>
                      <span>🏝️ {review.tour.name}</span>
                      <span>🧾 {review.order.invoiceNo}</span>
                      <span>📅 {new Date(review.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:ml-4">
                    {review.status !== 'APPROVED' && (
                      <button onClick={canManageReviews ? () => handleApprove(review.id) : handleBlocked} className="text-green-600 hover:text-green-700 text-xs font-medium">Setujui</button>
                    )}
                    {review.status !== 'HIDDEN' && (
                      <button onClick={canManageReviews ? () => handleHide(review.id) : handleBlocked} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Sembunyikan</button>
                    )}
                  </div>
                </div>

                {/* Balasan admin */}
                {!replyOpen && review.adminReply && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">↩️ Balasan Admin</p>
                    <p className="text-sm text-gray-700">{review.adminReply}</p>
                    {canManageReviews && (
                      <button onClick={() => openReply(review)} className="mt-2 text-blue-600 hover:text-blue-700 text-xs font-medium">Edit Balasan</button>
                    )}
                  </div>
                )}
                {!replyOpen && !review.adminReply && canManageReviews && (
                  <button onClick={() => openReply(review)} className="mt-3 text-blue-600 hover:text-blue-700 text-xs font-medium">+ Balas Review Ini</button>
                )}
                {replyOpen && (
                  <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Tulis balasan untuk customer..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleSaveReply}
                        disabled={replySaving}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {replySaving ? 'Menyimpan...' : 'Simpan Balasan'}
                      </button>
                      <button onClick={() => setReplyTarget(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Batal</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {reviews.length === 0 && <div className="text-center py-12 text-gray-500">Tidak ada review</div>}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); setLoading(true); }}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setLoading(true); }}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  );
}
