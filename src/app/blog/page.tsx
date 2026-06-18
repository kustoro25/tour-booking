import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Pagination from '@/components/ui/Pagination';

export const metadata: Metadata = {
  title: 'Blog — Tips Traveling & Inspirasi Wisata',
  description: 'Tips traveling, panduan destinasi, budget hemat, dan inspirasi wisata Nusantara.',
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 9;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page) || 1) : 1;
  const category = typeof params.category === 'string' ? params.category : '';
  const skip = (page - 1) * PER_PAGE;

  const where = { isPublished: true, ...(category ? { category } : {}) };

  const [posts, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PER_PAGE,
    }),
    prisma.blog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  // Get all categories for filter
  const allPosts = await prisma.blog.findMany({
    where: { isPublished: true },
    select: { category: true },
  });
  const categories = [...new Set(allPosts.map((p) => p.category))];

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const paginationParams: Record<string, string> = {};
  if (category) paginationParams.category = category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">
          Blog & Tips
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Tips Traveling & Inspirasi Wisata
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Panduan lengkap untuk liburan hemat, destinasi tersembunyi, dan tips traveling dari para ahli.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <Link
          href="/blog"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Semua
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/blog?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Blog Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum ada artikel</h3>
          <p className="text-gray-500">Artikel baru akan segera hadir. Kunjungi lagi nanti!</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Menampilkan {posts.length} dari {total} artikel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100"
              >
                {/* Cover */}
                <div className="h-44 bg-gray-200 relative overflow-hidden">
                  {post.coverImg ? (
                    <Image
                      src={post.coverImg}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                      <span className="text-white text-3xl">📝</span>
                    </div>
                  )}
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/blog"
            searchParams={paginationParams}
          />
        </>
      )}
    </div>
  );
}
