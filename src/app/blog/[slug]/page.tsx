import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blog.findUnique({ where: { slug, isPublished: true } });
  if (!post) return { title: 'Artikel Tidak Ditemukan' };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDesc || post.excerpt,
  };
}

async function getPost(slug: string) {
  const post = await prisma.blog.findUnique({
    where: { slug, isPublished: true },
  });

  if (!post) return null;

  // Increment view count
  await prisma.blog.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // Get related posts (same category)
  const related = await prisma.blog.findMany({
    where: { category: post.category, id: { not: post.id }, isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  return { post, related };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) notFound();

  const { post, related } = data;

  let tags: string[] = [];
  try { tags = JSON.parse(post.tags); } catch { tags = post.tags ? [post.tags] : []; }

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-mist-dim mb-6">
        <Link href="/" className="hover:text-gold-300">Beranda</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-gold-300">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-ivory">{post.title}</span>
      </nav>

      {/* Article Header */}
      <div className="mb-8">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gold-400/15 text-gold-200 mb-4">
          {post.category}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ivory mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-mist-dim">
          <span className="flex items-center gap-1">👤 {post.author}</span>
          <span className="flex items-center gap-1">📅 {formatDate(post.createdAt)}</span>
          <span className="flex items-center gap-1">👁️ {post.viewCount + 1} views</span>
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImg && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-lg">
          <Image
            src={post.coverImg}
            alt={post.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-lg max-w-none prose-headings:text-ivory prose-p:text-mist prose-a:text-gold-300 prose-img:rounded-xl prose-img:shadow-md mb-12">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12 pt-8 border-t border-ink-700">
          {tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-ink-800 text-mist text-sm rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-ink-700">
          <h2 className="text-xl font-bold text-ivory mb-6">Artikel Terkait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group bg-ink-850 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-ink-700"
              >
                <div className="h-36 bg-ink-700 relative overflow-hidden">
                  {r.coverImg ? (
                    <Image src={r.coverImg} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-300 to-gold-600">
                      <span className="text-white text-2xl">📝</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ivory group-hover:text-gold-300 text-sm line-clamp-2">{r.title}</h3>
                  <p className="text-xs text-mist-dim mt-1">{formatDate(r.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-ink-700">
        <Link href="/blog" className="text-gold-300 hover:text-gold-200 text-sm font-medium">
          ← Kembali ke Blog
        </Link>
      </div>
    </div>
  );
}
