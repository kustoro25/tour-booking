import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatCurrency, parseJsonSafe } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { ItineraryDay, TourCategory } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TourGallerySection from '@/components/tours/TourGallerySection';

export const dynamic = 'force-dynamic';

async function getTour(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: { slug, isActive: true },
    include: {
      gallery: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { customerName: true } } },
      },
    },
  });

  if (!tour) return null;

  const avgRating =
    tour.reviews.length > 0
      ? tour.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / tour.reviews.length
      : 0;

  const itinerary = parseJsonSafe<ItineraryDay[]>(tour.itinerary, []);
  const includes = parseJsonSafe<string[]>(tour.includes, []);
  const excludes = parseJsonSafe<string[]>(tour.excludes, []);

  return {
    ...tour,
    itinerary,
    includes,
    excludes,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

async function getSimilarTours(currentSlug: string, destination: string, category: string) {
  // Priority 1: same destination + same category (best match)
  // Priority 2: same destination
  // Priority 3: same category
  // Exclude current tour, fetch up to 4

  const similar = await prisma.tour.findMany({
    where: {
      slug: { not: currentSlug },
      isActive: true,
      OR: [{ destination }, { category }],
    },
    select: {
      slug: true,
      name: true,
      coverImg: true,
      category: true,
      destination: true,
      duration: true,
      priceAdult: true,
      discount: true,
    },
    take: 8, // fetch extra so we can sort client-side and pick best 4
    orderBy: { sortOrder: 'asc' },
  });

  // Score each tour: destination+category match = 0, destination match = 1, category match = 2, none = 3
  const scored = similar.map((t) => ({
    ...t,
    _score:
      t.destination === destination && t.category === category
        ? 0
        : t.destination === destination
          ? 1
          : t.category === category
            ? 2
            : 3,
  }));

  // Sort by score then return top 4
  scored.sort((a, b) => a._score - b._score);
  return scored.slice(0, 4);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getTour(slug);

  if (!tour) notFound();

  const similarTours = await getSimilarTours(slug, tour.destination, tour.category);

  const allImages: string[] = tour.coverImg
    ? [tour.coverImg, ...tour.gallery.map((g: { imageUrl: string }) => g.imageUrl)]
    : tour.gallery.map((g: { imageUrl: string }) => g.imageUrl);

  const galleryImages = allImages.map((url: string, i: number) => ({
    url,
    alt: `${tour.name} - Foto ${i + 1}`,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-mist-dim mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <a href="/" className="hover:text-gold-300">Beranda</a>
        <span className="mx-2">/</span>
        <a href="/tours" className="hover:text-gold-300">Paket Wisata</a>
        <span className="mx-2">/</span>
        <span className="text-ivory truncate max-w-[200px] sm:max-w-none inline-block align-bottom">{tour.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Image Gallery with Lightbox */}
          <TourGallerySection images={galleryImages} tourName={tour.name} />

          {/* Tour Info */}
          <div className="bg-ink-850 rounded-xl shadow-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                {TourCategoryLabels[tour.category as TourCategory] || tour.category}
              </span>
              <span className="text-mist-dim text-sm flex items-center gap-1"><span>🕐</span> {tour.duration}</span>
              <span className="text-mist-dim text-sm flex items-center gap-1"><span>📍</span> {tour.destination}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-ivory mb-4">{tour.name}</h1>

            {tour.avgRating > 0 && (
              <div className="flex items-center gap-3 mb-6 bg-yellow-500/10 rounded-lg px-4 py-2.5 border border-yellow-500/25">
                <StarRating rating={tour.avgRating} />
                <span className="text-sm font-medium text-yellow-300">{tour.avgRating.toFixed(1)}</span>
                <span className="text-sm text-yellow-300">({tour.reviews.length} review)</span>
              </div>
            )}

            {/* Itinerary */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-ivory mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gold-400/15 text-gold-300 rounded-lg flex items-center justify-center text-sm">📋</span>
                Itinerary
              </h2>
              {tour.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {tour.itinerary.map((day: ItineraryDay) => (
                    <div key={day.day} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gold-400 text-ink-950 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {day.day}
                      </div>
                      <div className="flex-1 bg-ink-900 rounded-xl p-4">
                        <h3 className="font-semibold text-ivory">{day.title}</h3>
                        <p className="text-mist text-sm mt-1">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-mist-dim text-sm">Itinerary belum tersedia.</p>
              )}
            </div>

            {/* Includes / Excludes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/25">
                <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center text-sm">✓</span>
                  Fasilitas Termasuk
                </h3>
                <ul className="space-y-1.5 text-sm text-green-200">
                  {tour.includes.length > 0 ? (
                    tour.includes.map((item: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> {item}</li>)
                  ) : (
                    <li>Informasi belum tersedia</li>
                  )}
                </ul>
              </div>
              <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/25">
                <h3 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center text-sm">✗</span>
                  Fasilitas Tidak Termasuk
                </h3>
                <ul className="space-y-1.5 text-sm text-red-200">
                  {tour.excludes.length > 0
                    ? tour.excludes.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> {item as string}</li>)
                    : <li>Informasi belum tersedia</li>}
                </ul>
              </div>
            </div>

            {/* Terms */}
            {tour.terms && (
              <div className="mt-8 bg-ink-900 rounded-xl p-5 border border-ink-700">
                <h3 className="font-semibold text-ivory mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-ink-700 text-ivory rounded-lg flex items-center justify-center text-sm">📄</span>
                  Syarat & Ketentuan
                </h3>
                <div
                  className="text-sm text-mist prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: tour.terms }}
                />
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-ink-850 rounded-xl shadow-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-ivory mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-500/15 text-yellow-300 rounded-lg flex items-center justify-center text-sm">⭐</span>
              Ulasan ({tour.reviews.length})
            </h2>
            {tour.reviews.length > 0 ? (
              <div className="space-y-4">
                {tour.reviews.map((review) => (
                  <div key={review.id} className="bg-ink-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-mist-dim">
                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-mist text-sm leading-relaxed">{review.reviewText}</p>
                    <p className="text-xs text-mist-dim mt-2 font-medium">{review.order.customerName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-mist-dim text-sm">Belum ada ulasan untuk paket ini.</p>
            )}
          </div>

          {/* Similar Tours */}
          {similarTours.length > 0 && (
            <div className="bg-ink-850 rounded-xl shadow-card p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-ivory mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-gold-400/15 text-gold-300 rounded-lg flex items-center justify-center text-sm">🔗</span>
                Tour Serupa
              </h2>
              <p className="text-sm text-mist-dim mb-5">
                Rekomendasi paket wisata yang mungkin Anda sukai
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {similarTours.map((similar) => (
                  <Link
                    key={similar.slug}
                    href={`/tours/${similar.slug}`}
                    className="group flex gap-3 bg-ink-900 rounded-xl p-3 hover:bg-gold-400/10 hover:shadow-md transition-all duration-300 border border-transparent hover:border-gold-500/20"
                  >
                    {/* Thumbnail */}
                    <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-ink-700 relative">
                      {similar.coverImg ? (
                        <Image
                          src={similar.coverImg}
                          alt={similar.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-300 to-gold-600">
                          <span className="text-white text-xl">🏝️</span>
                        </div>
                      )}
                      {/* Discount badge */}
                      {similar.discount > 0 && (
                        <span className="absolute top-1 left-1 bg-gradient-to-r from-gold-300 to-gold-600 text-ink-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          -{similar.discount}%
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] font-semibold text-gold-300 bg-gold-400/15 px-1.5 py-0.5 rounded-full mb-1">
                        {TourCategoryLabels[similar.category as TourCategory] || similar.category}
                      </span>
                      <h3 className="text-sm font-semibold text-ivory group-hover:text-gold-300 transition-colors line-clamp-2 leading-snug">
                        {similar.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-mist-dim">
                        <span className="flex items-center gap-0.5"><span>🕐</span> {similar.duration}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><span>📍</span> {similar.destination}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-700">
                        <p className="text-sm font-bold text-gold-300">{formatCurrency(similar.priceAdult)}</p>
                        <span className="text-[11px] text-gold-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Lihat →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Booking Card */}
        <div className="md:col-span-1">
          <div className="space-y-4 sm:space-y-6 md:sticky md:top-20">
            {/* Price Card */}
            <div className="bg-ink-850 rounded-xl shadow-card p-6 border border-ink-700">
              {tour.discount > 0 && (
                <span className="inline-block mb-3 bg-gradient-to-r from-gold-300 to-gold-600 text-ink-950 text-xs font-bold px-3 py-1 rounded-full">
                  🔥 Diskon {tour.discount}%
                </span>
              )}
              <div className="mb-4">
                <span className="text-sm text-mist-dim">Mulai dari</span>
                <p className="text-3xl font-bold text-gold-300">{formatCurrency(tour.priceAdult)}</p>
                <span className="text-sm text-mist-dim">/orang (dewasa)</span>
                {tour.priceChild > 0 && (
                  <p className="text-sm text-mist-dim mt-2 bg-ink-900 rounded-lg px-3 py-1.5">
                    👶 Anak: {formatCurrency(tour.priceChild)}/orang
                  </p>
                )}
              </div>

              <div className="border-t border-ink-700 pt-4 space-y-3 text-sm text-mist">
                <div className="flex justify-between items-center">
                  <span className="text-mist-dim">Durasi</span>
                  <span className="font-semibold text-ivory">{tour.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-mist-dim">Min. Peserta</span>
                  <span className="font-semibold text-ivory">{tour.minPax} orang</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-mist-dim">Kategori</span>
                  <span className="font-semibold text-ivory">
                    {TourCategoryLabels[tour.category as TourCategory]}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button href={`/tours/${tour.slug}/booking`} variant="accent" size="lg" fullWidth>
                  Booking Sekarang
                </Button>
              </div>
            </div>

            {/* Calendar Preview */}
            <BookingCalendar tourId={tour.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
