'use client';

import { useState, useEffect, useRef, use } from 'react';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/lib/i18n/client';

interface ReviewInfo {
  customerName: string;
  tourName: string;
  tourDate: string;
  destination: string;
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { t, locale } = useI18n();
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error');

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInfo(data.data);
        } else {
          setError(data.error || t('review.invalidLink'));
        }
      })
      .catch(() => setError(t('review.loadFailed')))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, 3 - photos.length);
    if (remaining === 0) return;

    const selected = Array.from(files).slice(0, remaining);
    setUploadingPhoto(true);
    try {
      for (const file of selected) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'tour-booking/review-photos');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.success || !data.url) throw new Error(data.error || 'upload failed');
        setPhotos((prev) => (prev.length >= 3 ? prev : [...prev, data.url]));
      }
    } catch {
      setMessage(t('review.photosUploadFailed'));
      setMessageKind('error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage(t('review.pickRating'));
      setMessageKind('error');
      return;
    }
    if (reviewText.length < 10) {
      setMessage(t('review.minChars'));
      setMessageKind('error');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviewText, photos }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setMessage(data.message);
        setMessageKind('success');
      } else {
        setMessage(data.error || t('review.submitFailed'));
        setMessageKind('error');
      }
    } catch {
      setMessage(t('review.submitFailedRetry'));
      setMessageKind('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-ink-850 rounded-xl shadow-sm p-6 space-y-6">
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
        <h1 className="text-2xl font-bold text-ivory mb-2">{t('review.errorTitle')}</h1>
        <p className="text-mist mb-6">{error}</p>
        <Button href="/" variant="outline">{t('review.backHome')}</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-ivory mb-2">{t('review.thanksTitle')}</h1>
        <p className="text-mist mb-2">{message}</p>
        <p className="text-mist-dim text-sm mb-8">
          {t('review.thanksDesc')}
        </p>
        <div className="flex justify-center gap-3">
          <Button href="/" variant="outline">{t('review.backHome')}</Button>
          <Button href="/sewa-mobil" variant="primary">{t('review.viewFleet')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-ivory mb-6 text-center">
        {t('review.heading')}
      </h1>

      {info && (
        <div className="bg-gold-400/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <p className="text-sm text-gold-200 mb-1">{t('review.hi')} <strong>{info.customerName}</strong>!</p>
          <p className="text-sm text-gold-300">
            {t('review.storyA')}{' '}
            <strong>{info.tourName}</strong> {t('review.storyB')}{' '}
            <strong>{info.destination}</strong> {t('review.storyC')}{' '}
            {new Date(info.tourDate).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-ink-850 rounded-xl shadow-sm p-5 sm:p-8 space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-semibold text-mist mb-3">
            {t('review.ratingLabel')} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-2xl sm:text-3xl transition-transform hover:scale-110 focus:outline-none"
                aria-label={t('review.starsLabel', { count: star })}
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= rating ? 'text-yellow-400' : 'text-mist'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-sm text-mist-dim">
              {rating === 0 ? t('review.pickRatingHint') : `${rating} / 5`}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-semibold text-mist mb-3">
            {t('review.reviewLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review"
            rows={5}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t('review.reviewPlaceholder')}
            className="w-full border border-ink-600 rounded-lg px-4 py-3 text-mist focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition resize-y"
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-mist-dim">
              {reviewText.length < 10 ? t('review.minCharsHint') : ''}
            </span>
            <span className="text-xs text-mist-dim">{reviewText.length}/1000</span>
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-mist mb-3">
            {t('review.photosLabel')}
          </label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {photos.map((url, i) => (
                <div key={url} className="relative w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL foto berasal dari upload dinamis Cloudinary */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-ink-600"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={t('review.photosRemove')}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="review-photos"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto || photos.length >= 3}
            className="px-4 py-2 border border-ink-600 rounded-lg text-sm text-mist hover:border-gold-400 hover:text-gold-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadingPhoto
              ? t('review.photosUploading')
              : photos.length >= 3
                ? '✓ 3/3'
                : `+ ${t('review.photosHint')}`}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              messageKind === 'success'
                ? 'bg-green-500/10 text-green-300'
                : 'bg-red-500/10 text-red-300'
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
          disabled={submitting || uploadingPhoto}
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
              {t('review.submitting')}
            </span>
          ) : (
            t('review.submit')
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-mist-dim mt-6">
        {t('review.moderateNote')}
      </p>
    </div>
  );
}
