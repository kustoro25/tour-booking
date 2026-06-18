'use client';

import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  status: string;
  photos: string;
  createdAt: string;
  order: { customerName: string; invoiceNo: string };
  tour: { name: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchReviews(); }, [statusFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/reviews?status=${statusFilter}` : '/api/admin/reviews';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setReviews(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/reviews/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVED' }) });
    fetchReviews();
  };

  const handleHide = async (id: string) => {
    await fetch(`/api/admin/reviews/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'HIDDEN' }) });
    fetchReviews();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manajemen Review</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'PENDING', 'APPROVED', 'HIDDEN'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
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
          {reviews.map(review => (
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
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>👤 {review.order.customerName}</span>
                    <span>🏝️ {review.tour.name}</span>
                    <span>📅 {new Date(review.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-4">
                  {review.status !== 'APPROVED' && (
                    <button onClick={() => handleApprove(review.id)} className="text-green-600 hover:text-green-700 text-xs font-medium">Setujui</button>
                  )}
                  {review.status !== 'HIDDEN' && (
                    <button onClick={() => handleHide(review.id)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Sembunyikan</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <div className="text-center py-12 text-gray-500">Tidak ada review</div>}
        </div>
      )}
    </div>
  );
}
