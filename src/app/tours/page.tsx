import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';
import TourFilter from '@/components/tours/TourFilter';
import Pagination from '@/components/ui/Pagination';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const PER_PAGE = 9;

interface ToursPageData {
  label: string;
  heading: string;
  subheading: string;
}

const FALLBACK: ToursPageData = {
  label: 'Koleksi Kami',
  heading: 'Paket Wisata',
  subheading: 'Jelajahi berbagai pilihan paket tour HAYBALI TRANS ke destinasi terbaik di Bali',
};

async function getToursPageData(): Promise<ToursPageData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'tours' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        label: parsed.label || FALLBACK.label,
        heading: parsed.heading || FALLBACK.heading,
        subheading: parsed.subheading || FALLBACK.subheading,
      };
    }
  } catch { /* fallback */ }
  return FALLBACK;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getToursPageData();
  return { title: data.heading, description: data.subheading.slice(0, 160) };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getTours(searchParams: { [key: string]: string | string[] | undefined }, page: number, limit: number) {
  const destination = typeof searchParams.destination === 'string' ? searchParams.destination : '';
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const minPrice = typeof searchParams.minPrice === 'string' ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseFloat(searchParams.maxPrice) : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isActive: true,
    // Layanan khusus (sewa mobil & antar-jemput) punya halaman sendiri
    category: { notIn: ['CAR_RENTAL', 'AIRPORT_TRANSFER'] },
  };

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

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case 'cheapest': orderBy.priceAdult = 'asc'; break;
    case 'expensive': orderBy.priceAdult = 'desc'; break;
    case 'rating': orderBy.createdAt = 'desc'; break;
    default: orderBy.createdAt = 'desc';
  }

  const skip = (page - 1) * limit;

  const [tours, total] = await Promise.all([
    prisma.tour.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: { select: { orders: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.tour.count({ where: where as any }),
  ]);

  return {
    tours: tours.map((tour) => {
      const avgRating =
        tour.reviews.length > 0
          ? tour.reviews.reduce((sum, r) => sum + r.rating, 0) / tour.reviews.length
          : 0;
      return {
        ...tour,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    }),
    total,
  };
}

export default async function ToursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page) || 1) : 1;
  const [toursResult, cms] = await Promise.all([
    getTours(params, page, PER_PAGE),
    getToursPageData(),
  ]);
  const { tours, total } = toursResult;
  const totalPages = Math.ceil(total / PER_PAGE);
  const currentDestination = typeof params.destination === 'string' ? params.destination : '';
  const currentCategory = typeof params.category === 'string' ? params.category : '';
  const currentSort = typeof params.sort === 'string' ? params.sort : 'newest';

  // Build search params for pagination (exclude page itself)
  const paginationParams: Record<string, string> = {};
  if (currentDestination) paginationParams.destination = currentDestination;
  if (currentCategory) paginationParams.category = currentCategory;
  if (currentSort && currentSort !== 'newest') paginationParams.sort = currentSort;
  const search = typeof params.search === 'string' ? params.search : '';
  if (search) paginationParams.search = search;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">{cms.label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{cms.heading}</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          {cms.subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="md:col-span-1">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-2xl animate-pulse" />}>
            <TourFilter
              currentDestination={currentDestination}
              currentCategory={currentCategory}
              currentSort={currentSort}
            />
          </Suspense>
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
            <>
              {/* Result count */}
              <p className="text-sm text-gray-500 mb-4">
                Menampilkan {tours.length} dari {total} paket wisata
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tours/${tour.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
                  >
                    <div className="h-44 bg-gray-200 relative overflow-hidden">
                      {tour.coverImg ? (
                        <Image src={tour.coverImg} alt={tour.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                          <span className="text-white text-3xl">🏝️</span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                        <span className="text-white text-sm font-semibold flex items-center gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          Lihat Detail
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
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
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-0 transition-all duration-300">
                          Pesan
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath="/tours"
                searchParams={paginationParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
