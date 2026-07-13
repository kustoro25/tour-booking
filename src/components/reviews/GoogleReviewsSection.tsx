'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import StarRating from '@/components/ui/StarRating';

interface GoogleReviewData {
  authorName: string;
  authorUrl: string | null;
  profilePhoto: string | null;
  rating: number;
  text: string;
  time: string;
  relativeTime: string;
}

interface GoogleReviewsResponse {
  placeRating: number;
  totalRatings: number;
  placeUrl: string;
  reviews: GoogleReviewData[];
}

export default function GoogleReviewsSection() {
  const [data, setData] = useState<GoogleReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && res.data.reviews?.length > 0) {
          setData(res.data);
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-5 w-32 mx-auto mb-3" />
            <Skeleton className="h-8 w-80 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">⭐</span>
            <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase">
              Google Reviews
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Apa Kata Mereka di Google Maps
          </h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl font-bold text-gray-900">{data.placeRating.toFixed(1)}</span>
            <div>
              <StarRating rating={data.placeRating} size="md" />
              <p className="text-sm text-gray-500 mt-0.5">
                {data.totalRatings.toLocaleString('id-ID')} ulasan di Google
              </p>
            </div>
          </div>
        </div>

        {/* Auto-scrolling carousel */}
        <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          <div
            className="flex gap-5"
            style={{
              animation: 'scrollReviews 30s linear infinite',
              width: 'max-content',
            }}
          >
            {/* Render reviews twice for seamless loop */}
            {[...data.reviews, ...data.reviews].map((review, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-card border border-gray-100 flex-shrink-0"
                style={{ width: '340px' }}
              >
              {/* Header: avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                {review.profilePhoto ? (
                  <img
                    src={review.profilePhoto}
                    alt={review.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {review.authorName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{review.authorName}</p>
                  <p className="text-xs text-gray-400">{review.relativeTime}</p>
                </div>
              </div>

              {/* Rating */}
              <StarRating rating={review.rating} size="sm" />

              {/* Review text */}
              <p className="text-gray-600 text-sm mt-2 leading-relaxed line-clamp-5">
                {review.text}
              </p>

              {/* Google logo */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Posted on Google</span>
              </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyframes injected via style tag */}
        <style>{`
          @keyframes scrollReviews {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
