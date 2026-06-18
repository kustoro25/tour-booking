import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';
import Link from 'next/link';
import StarRating from '@/components/ui/StarRating';
import TourFilter from '@/components/tours/TourFilter';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getTours(searchParams: { [key: string]: string | string[] | undefined }) {
  const destination = typeof searchParams.destination === 'string' ? searchParams.destination : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const minPrice = typeof searchParams.minPrice === 'string' ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseFloat(searchParams.maxPrice) : undefined;
  const duration = typeof searchParams.duration === 'string' ? searchParams.duration : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };

  if (destination) where.destination = destination;
  if (category) where.category = category;
  if (search) where.name = { contains: search };

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    where.priceAdult = priceFilter;
  }

  // Duration filter
  if (duration) {
    const durMap: Record<string, number[]> = {
      '1-2': [1, 2],
      '3-4': [3, 4],
      '5-7': [5, 6, 7],
      '8+': [8, 99],
    };
    // Simplified: filter by duration string pattern
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case 'cheapest': orderBy.priceAdult = 'asc'; break;
    case 'expensive': orderBy.priceAdult = 'desc'; break;
    case 'rating': orderBy.createdAt = 'desc'; break; // Simplified
    default: orderBy.createdAt = 'desc';
  }

  const tours = await prisma.tour.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: where as any,
    orderBy,
    include: {
      _count: { select: { orders: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  return tours.map((tour) => {
    const avgRating =
      tour.reviews.length > 0
        ? tour.reviews.reduce((sum, r) => sum + r.rating, 0) / tour.reviews.length
        : 0;
    return {
      ...tour,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  });
}

export default async function ToursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tours = await getTours(params);
  const currentDestination = typeof params.destination === 'string' ? params.destination : '';
  const currentCategory = typeof params.category === 'string' ? params.category : '';
  const currentSort = typeof params.sort === 'string' ? params.sort : 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Koleksi Kami</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Paket Wisata</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Jelajahi berbagai pilihan paket tour ke destinasi terbaik di Indonesia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="md:col-span-1">
          <TourFilter
            currentDestination={currentDestination}
            currentCategory={currentCategory}
            currentSort={currentSort}
          />
        </aside>

        {/* Tour Grid */}
        <div className="md:col-span-3">
          {tours.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-card">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada paket ditemukan</h3>
              <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <Link
                  key={tour.id}
                  href={`/tours/${tour.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-card hover-lift"
                >
                  <div className="h-44 bg-gray-200 relative overflow-hidden">
                    {tour.coverImg ? (
                      <img src={tour.coverImg} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                        <span className="text-white text-3xl">🏝️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute top-2 left-2 bg-white/95 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {TourCategoryLabels[tour.category as TourCategory] || tour.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1"><span>🕐</span> {tour.duration}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span>📍</span> {tour.destination}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {tour.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {tour.avgRating !== undefined && tour.avgRating > 0 ? (
                        <StarRating rating={tour.avgRating} size="sm" />
                      ) : (
                        <span className="text-xs text-gray-400">Belum ada review</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400">Mulai dari</span>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(tour.priceAdult)}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform duration-200">Detail →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
