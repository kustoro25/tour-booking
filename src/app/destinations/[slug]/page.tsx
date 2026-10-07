import { prisma } from '@/lib/prisma';
import { parseJsonSafe, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await prisma.destination.findFirst({ where: { slug, isActive: true } });
  if (!destination) return { title: 'Destinasi Tidak Ditemukan' };
  return {
    title: destination.name,
    description: destination.shortDescription,
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const destination = await prisma.destination.findFirst({
    where: { slug, isActive: true },
    include: {
      tours: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, priceAdult: true, duration: true, coverImg: true },
        take: 6,
      },
    },
  });

  // Fetch CMS CTA data
  let ctaHeading = 'Siap Berpetualang?';
  let ctaSubheading = 'Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!';
  let ctaButtonText = 'Lihat Paket Tour';
  let ctaButtonLink = '/tours';
  try {
    const ctaPage = await prisma.page.findUnique({ where: { slug: 'destinations-cta' } });
    if (ctaPage?.content) {
      const c = JSON.parse(ctaPage.content);
      ctaHeading = c.heading || ctaHeading;
      ctaSubheading = c.subheading || ctaSubheading;
      ctaButtonText = c.ctaText || ctaButtonText;
      ctaButtonLink = c.ctaLink || ctaButtonLink;
    }
  } catch { /* fallback */ }

  if (!destination) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Destinasi Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-6">Maaf, destinasi yang Anda cari tidak tersedia.</p>
        <Button href="/destinations" variant="primary">Lihat Semua Destinasi</Button>
      </div>
    );
  }

  // Real stats from database
  const [tourCount, ratingAgg] = await Promise.all([
    prisma.tour.count({
      where: { destinationId: destination.id, isActive: true },
    }),
    prisma.review.aggregate({
      where: {
        tour: { destinationId: destination.id, isActive: true },
        status: 'APPROVED',
      },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const avgRating = ratingAgg._avg.rating
    ? Math.round(ratingAgg._avg.rating * 10) / 10
    : destination.rating;
  const reviewCount = ratingAgg._count.rating ?? 0;

  const gallery: string[] = parseJsonSafe(destination.gallery, []);
  const activities: string[] = parseJsonSafe(destination.activities, []);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-56 sm:h-80 md:h-96 overflow-hidden">
        <Image
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
          alt={destination.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-10">
          <div className="max-w-7xl mx-auto">
            <p className="text-blue-200 text-xs sm:text-sm mb-1 sm:mb-2">{destination.location}</p>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
              {destination.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-500'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-white ml-1 font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-gray-300 ml-1">({reviewCount} ulasan)</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-200">{tourCount} Paket Tour</span>
              {destination.bestTimeToVisit && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-200">🕐 {destination.bestTimeToVisit}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tentang {destination.name}</h2>
              <div
                className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: destination.description }}
              />
            </div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Galeri Foto</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden relative">
                      <Image
                        src={url}
                        alt={`${destination.name} gallery ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Aktivitas di {destination.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activities.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 md:sticky md:top-20">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informasi Destinasi</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs text-gray-500">Lokasi</p>
                    <p className="text-sm font-medium text-gray-900">{destination.location}</p>
                  </div>
                </div>
                {destination.bestTimeToVisit && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div>
                      <p className="text-xs text-gray-500">Waktu Terbaik</p>
                      <p className="text-sm font-medium text-gray-900">{destination.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-xs text-gray-500">Paket Tour</p>
                    <p className="text-sm font-medium text-gray-900">{tourCount} tersedia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">⭐</span>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-sm font-medium text-gray-900">
                      {avgRating.toFixed(1)} / 5.0 ({reviewCount} ulasan)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">{ctaHeading}</h3>
              <p className="text-blue-100 text-sm mb-4">
                {ctaSubheading.replace('{{name}}', destination.name)}
              </p>
              <Button href={ctaButtonLink} variant="accent" size="sm" fullWidth>
                {ctaButtonText}
              </Button>
            </div>

            {/* Related Tours */}
            {destination.tours && destination.tours.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Paket Tour ke {destination.name}
                </h3>
                <div className="space-y-3">
                  {destination.tours.map((tour: {
                    id: string;
                    name: string;
                    slug: string;
                    priceAdult: number;
                    duration: string;
                    coverImg: string | null;
                  }) => (
                    <Link
                      key={tour.id}
                      href={`/tours/${tour.slug}`}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
                        {tour.coverImg && (
                          <Image
                            src={tour.coverImg}
                            alt={tour.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                          {tour.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tour.duration} · {formatCurrency(tour.priceAdult)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {tourCount > 6 && (
                    <Link
                      href={`/tours?destination=${encodeURIComponent(destination.name)}`}
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Lihat {tourCount - 6} paket lainnya →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
