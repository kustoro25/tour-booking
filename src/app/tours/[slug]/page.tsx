import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, parseJsonSafe } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { ItineraryDay, TourCategory } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import BookingCalendar from '@/components/booking/BookingCalendar';

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getTour(slug);

  if (!tour) notFound();

  const allImages: string[] = tour.coverImg
    ? [tour.coverImg, ...tour.gallery.map((g: { imageUrl: string }) => g.imageUrl)]
    : tour.gallery.map((g: { imageUrl: string }) => g.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <a href="/" className="hover:text-blue-600">Beranda</a>
        <span className="mx-2">/</span>
        <a href="/tours" className="hover:text-blue-600">Paket Wisata</a>
        <span className="mx-2">/</span>
        <span className="text-gray-800 truncate max-w-[200px] sm:max-w-none inline-block align-bottom">{tour.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {allImages.length > 0 ? (
              <>
                {/* Mobile: horizontal scroll */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-1 sm:hidden">
                  {allImages.slice(0, 5).map((img, i) => (
                    <div key={i} className="min-w-[85vw] snap-center flex-shrink-0">
                      <img
                        src={img}
                        alt={`${tour.name} ${i + 1}`}
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  ))}
                </div>
                {/* Desktop: grid layout */}
                <div className="hidden sm:grid grid-cols-2 gap-1">
                  <div className="col-span-2">
                    <img
                      src={allImages[0]}
                      alt={tour.name}
                      className="w-full h-96 object-cover"
                    />
                  </div>
                  {allImages.slice(1, 5).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${tour.name} ${i + 2}`}
                      className="w-full h-48 object-cover"
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-56 sm:h-96 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                <span className="text-white text-5xl sm:text-6xl">🏝️</span>
              </div>
            )}
          </div>

          {/* Tour Info */}
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                {TourCategoryLabels[tour.category as TourCategory] || tour.category}
              </span>
              <span className="text-gray-500 text-sm flex items-center gap-1"><span>🕐</span> {tour.duration}</span>
              <span className="text-gray-500 text-sm flex items-center gap-1"><span>📍</span> {tour.destination}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{tour.name}</h1>

            {tour.avgRating > 0 && (
              <div className="flex items-center gap-3 mb-6 bg-yellow-50 rounded-lg px-4 py-2.5 border border-yellow-100">
                <StarRating rating={tour.avgRating} />
                <span className="text-sm font-medium text-yellow-700">{tour.avgRating.toFixed(1)}</span>
                <span className="text-sm text-yellow-600">({tour.reviews.length} review)</span>
              </div>
            )}

            {/* Itinerary */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📋</span>
                Itinerary
              </h2>
              {tour.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {tour.itinerary.map((day: ItineraryDay) => (
                    <div key={day.day} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {day.day}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900">{day.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Itinerary belum tersedia.</p>
              )}
            </div>

            {/* Includes / Excludes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center text-sm">✓</span>
                  Fasilitas Termasuk
                </h3>
                <ul className="space-y-1.5 text-sm text-green-800">
                  {tour.includes.length > 0 ? (
                    tour.includes.map((item: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> {item}</li>)
                  ) : (
                    <li>Informasi belum tersedia</li>
                  )}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center text-sm">✗</span>
                  Fasilitas Tidak Termasuk
                </h3>
                <ul className="space-y-1.5 text-sm text-red-800">
                  {tour.excludes.length > 0
                    ? tour.excludes.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> {item as string}</li>)
                    : <li>Informasi belum tersedia</li>}
                </ul>
              </div>
            </div>

            {/* Terms */}
            {tour.terms && (
              <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-gray-700 text-white rounded-lg flex items-center justify-center text-sm">📄</span>
                  Syarat & Ketentuan
                </h3>
                <div
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: tour.terms }}
                />
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center text-sm">⭐</span>
              Ulasan ({tour.reviews.length})
            </h2>
            {tour.reviews.length > 0 ? (
              <div className="space-y-4">
                {tour.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.reviewText}</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">{review.order.customerName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada ulasan untuk paket ini.</p>
            )}
          </div>
        </div>

        {/* Sidebar - Booking Card */}
        <div className="md:col-span-1">
          <div className="space-y-4 sm:space-y-6 md:sticky md:top-20">
            {/* Price Card */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
              {tour.discount > 0 && (
                <span className="inline-block mb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  🔥 Diskon {tour.discount}%
                </span>
              )}
              <div className="mb-4">
                <span className="text-sm text-gray-400">Mulai dari</span>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(tour.priceAdult)}</p>
                <span className="text-sm text-gray-400">/orang (dewasa)</span>
                {tour.priceChild > 0 && (
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-1.5">
                    👶 Anak: {formatCurrency(tour.priceChild)}/orang
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Durasi</span>
                  <span className="font-semibold text-gray-800">{tour.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Min. Peserta</span>
                  <span className="font-semibold text-gray-800">{tour.minPax} orang</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Kategori</span>
                  <span className="font-semibold text-gray-800">
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
