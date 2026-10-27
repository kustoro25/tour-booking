import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Pagination from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 9;

interface BlogPageData {
  label: string;
  heading: string;
  subheading: string;
}

const FALLBACK: BlogPageData = {
  label: 'Blog & Tips',
  heading: 'Tips Traveling & Inspirasi Wisata',
  subheading: 'Panduan lengkap untuk liburan hemat, destinasi tersembunyi, dan tips traveling dari para ahli.',
};

async function getBlogPageData(): Promise<BlogPageData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'blog' } });
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
  const data = await getBlogPageData();
  return { title: data.heading, description: data.subheading.slice(0, 160) };
}

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

  const cms = await getBlogPageData();

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
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">
          {cms.label}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4">
          {cms.heading}
        </h1>
        <p className="text-mist-dim max-w-2xl mx-auto">
          {cms.subheading}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <Link
          href="/blog"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-gold-400 text-ink-950' : 'bg-ink-850 text-mist border border-ink-600 hover:bg-ink-800'
          }`}
        >
          Semua
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/blog?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-gold-400 text-ink-950' : 'bg-ink-850 text-mist border border-ink-600 hover:bg-ink-800'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Blog Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-ink-850 rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-mist mb-2">Belum ada artikel</h3>
          <p className="text-mist-dim">Artikel baru akan segera hadir. Kunjungi lagi nanti!</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-mist-dim mb-4">
            Menampilkan {posts.length} dari {total} artikel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-ink-850 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-ink-700"
              >
                {/* Cover */}
                <div className="h-44 bg-ink-700 relative overflow-hidden">
                  {post.coverImg ? (
                    <Image
                      src={post.coverImg}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-300 to-gold-600">
                      <span className="text-white text-3xl">📝</span>
                    </div>
                  )}
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-ink-900/95 backdrop-blur-sm text-mist text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-mist-dim mb-2">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                  </div>
                  <h3 className="font-semibold text-ivory group-hover:text-gold-300 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-mist-dim line-clamp-2">{post.excerpt}</p>
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
