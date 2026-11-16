'use client';

// ============================================================================
// TestimonialsClient — renderer klien halaman /testimonials. Review dari
// server (force-dynamic), teks UI dari kamus i18n; konten CMS dipakai saat
// locale = id.
// ============================================================================

import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface TestimonialReview {
  id: string;
  reviewText: string;
  rating: number;
  customerName: string;
  tourName: string;
  createdAt: string;
}

interface Distribution {
  star: number;
  count: number;
  percentage: number;
}

interface TestimonialsCms {
  label: string;
  heading: string;
  subheading: string;
}

interface TestimonialsClientProps {
  reviews: TestimonialReview[];
  total: number;
  avgRating: number;
  distribution: Distribution[];
  page: number;
  totalPages: number;
  cms: TestimonialsCms;
}

export default function TestimonialsClient({
  reviews,
  total,
  avgRating,
  distribution,
  page,
  totalPages,
  cms,
}: TestimonialsClientProps) {
  const { t, locale } = useI18n();
  useTranslatedMeta(t('meta.testimonials'), t('testimonials.subheading'));

  const label = locale === 'id' ? cms.label : t('testimonials.label');
  const heading = locale === 'id' ? cms.heading : t('testimonials.heading');
  const subheading = locale === 'id' ? cms.subheading : t('testimonials.subheading');
  const dateLocale = locale === 'id' ? 'id-ID' : 'en-US';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4">
          {heading}
        </h1>
        <p className="text-mist-dim max-w-2xl mx-auto">
          {subheading}
        </p>
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-gradient-to-br from-gold-400/10 to-ink-950 rounded-xl shadow-card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 border border-gold-500/20">
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-extrabold gradient-text">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="md" />
            <p className="text-sm text-mist-dim mt-2 font-medium">{t('testimonials.reviewCount', { total })}</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-right text-mist font-medium">{d.star} ★</span>
                <div className="flex-1 bg-ink-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-gold-300 to-gold-400 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-mist-dim text-xs">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <>
          <p className="text-sm text-mist-dim mb-4">
            {t('testimonials.showing', { count: reviews.length, total })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-ink-850 rounded-xl shadow-card p-6 border border-ink-700 hover-lift">
                <div className="text-4xl text-gold-200 mb-2 leading-none">&ldquo;</div>
                <StarRating rating={review.rating} size="sm" />
                <p className="text-mist mt-3 text-sm leading-relaxed">
                  {review.reviewText}
                </p>
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <p className="font-semibold text-ivory text-sm">{review.customerName}</p>
                  <p className="text-xs text-mist-dim">{review.tourName}</p>
                  <p className="text-xs text-mist-dim mt-1">
                    {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/testimonials"
          />
        </>
      ) : (
        <div className="text-center py-16 bg-ink-850 rounded-xl shadow-card border border-ink-700">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-mist font-medium">{t('testimonials.noReviewsTitle')}</p>
          <p className="text-sm text-mist-dim mt-1">{t('testimonials.noReviewsDesc')}</p>
        </div>
      )}

      <div className="text-center mt-12">
        <Button href="/sewa-mobil" variant="primary" size="lg">
          {t('testimonials.viewFleet')}
        </Button>
      </div>
    </div>
  );
}
