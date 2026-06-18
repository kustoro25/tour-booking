'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface ReviewInfo {
  customerName: string;
  tourName: string;
  tourDate: string;
  destination: string;
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInfo(data.data);
        } else {
          setError(data.error || 'Link tidak valid');
        }
      })
      .catch(() => setError('Gagal memuat data review'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage('Silakan pilih rating bintang');
      return;
    }
    if (reviewText.length < 10) {
      setMessage('Ulasan minimal 10 karakter');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviewText, photos: [] }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Gagal mengirim review');
      }
    } catch {
      setMessage('Gagal mengirim review. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="space-y-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button href="/" variant="outline">Kembali ke Beranda</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h1>
        <p className="text-gray-600 mb-2">{message}</p>
        <p className="text-gray-500 text-sm mb-8">
          Review Anda akan ditinjau oleh tim kami sebelum ditampilkan di halaman publik.
        </p>
        <div className="flex justify-center gap-3">
          <Button href="/" variant="outline">Kembali ke Beranda</Button>
          <Button href="/tours" variant="primary">Lihat Paket Tour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
        Bagaimana Pengalaman Liburan Anda?
      </h1>

      {info && (
        <div className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <p className="text-sm text-blue-700 mb-1">Hai, <strong>{info.customerName}</strong>!</p>
          <p className="text-sm text-blue-600">
            Ceritakan pengalaman Anda mengikuti tour{' '}
            <strong>{info.tourName}</strong> ke{' '}
            <strong>{info.destination}</strong> pada tanggal{' '}
            {new Date(info.tourDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 sm:p-8 space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Rating Anda <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-2xl sm:text-3xl transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${star} bintang`}
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-500">
              {rating === 0 ? 'Pilih rating' : `${rating} / 5`}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-semibold text-gray-700 mb-3">
            Ceritakan Pengalaman Anda <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review"
            rows={5}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ceritakan pengalaman seru Anda selama tour... (min. 10 karakter)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              {reviewText.length < 10 ? 'Minimal 10 karakter' : ''}
            </span>
            <span className="text-xs text-gray-400">{reviewText.length}/1000</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes('Terima kasih')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Mengirim...
            </span>
          ) : (
            '✍️ Kirim Review'
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Review Anda akan dimoderasi oleh tim kami sebelum ditampilkan di halaman publik.
      </p>
    </div>
  );
}
