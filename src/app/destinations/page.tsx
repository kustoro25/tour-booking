import { prisma } from '@/lib/prisma';
import { parseJsonSafe } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Pagination from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

interface DestinationsPageData {
  label: string;
  heading: string;
  subheading: string;
  highlightTitle: string;
  allTitle: string;
}

const FALLBACK: DestinationsPageData = {
  label: 'Jelajahi',
  heading: 'Destinasi Wisata',
  subheading: 'Temukan destinasi impian Anda di seluruh penjuru Nusantara. Dari pantai eksotis hingga pegunungan megah — semua ada di sini.',
  highlightTitle: 'Destinasi Unggulan',
  allTitle: 'Semua Destinasi',
};

async function getDestinationsPageData(): Promise<DestinationsPageData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'destinations' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        label: parsed.label || FALLBACK.label,
        heading: parsed.heading || FALLBACK.heading,
        subheading: parsed.subheading || FALLBACK.subheading,
        highlightTitle: parsed.highlightTitle || FALLBACK.highlightTitle,
        allTitle: parsed.allTitle || FALLBACK.allTitle,
      };
    }
  } catch { /* fallback */ }
  return FALLBACK;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getDestinationsPageData();
  return {
    title: data.heading,
    description: data.subheading.slice(0, 160),
  };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DestinationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page) || 1) : 1;
  const skip = (page - 1) * PER_PAGE;

  const [destinations, total, cms] = await Promise.all([
    prisma.destination.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: PER_PAGE,
      include: { _count: { select: { tours: true } } },
    }),
    prisma.destination.count({ where: { isActive: true } }),
    getDestinationsPageData(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const data = cms || FALLBACK;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <span className="inline-block text-teal-600 text-sm font-semibold tracking-wide uppercase mb-2">{data.label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {data.heading}
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          {data.subheading}
        </p>
      </div>

      {/* Highlight Section */}
      {destinations.filter((d) => d.highlight).length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center text-sm">⭐</span>
            {data.highlightTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destinations
              .filter((d) => d.highlight)
              .map((dest) => (
                <DestinationCard key={dest.id} destination={dest} featured />
              ))}
          </div>
        </div>
      )}

      {/* All Destinations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">🗺️</span>
          {data.allTitle} ({total})
        </h2>
        {destinations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-card">
            <p className="text-gray-500">Belum ada destinasi yang tersedia.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Menampilkan {destinations.length} dari {total} destinasi
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/destinations"
            />
          </>
        )}
      </div>
    </div>
  );
}

function DestinationCard({
  destination,
  featured = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destination: any;
  featured?: boolean;
}) {
  const activities: string[] = parseJsonSafe(destination.activities, []);
  const tourCount = destination._count?.tours || 0;

  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={`group bg-white rounded-xl shadow-card overflow-hidden hover-lift ${
        featured ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
          alt={destination.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {featured && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            ⭐ Unggulan
          </span>
        )}
        <div className="absolute bottom-3 right-3 glass rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{destination.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {destination.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {destination.location}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {destination.shortDescription}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {activities.slice(0, 3).map((act: string, i: number) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {act}
            </span>
          ))}
          {activities.length > 3 && (
            <span className="text-xs text-gray-400">+{activities.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span>{tourCount} paket tour tersedia</span>
          <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform duration-200 inline-flex items-center">
            Lihat Detail →
          </span>
        </div>
      </div>
    </Link>
  );
}
