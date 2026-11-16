import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import TestimonialsClient from '@/components/pages/TestimonialsClient';

export const dynamic = 'force-dynamic';

const PER_PAGE = 9;

interface TestimonialsPageData {
  label: string;
  heading: string;
  subheading: string;
}

const FALLBACK: TestimonialsPageData = {
  label: 'Testimoni',
  heading: 'Cerita dari Mereka yang Telah Berpetualang',
  subheading: 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan serunya liburan tanpa beban bersama HAYBALI TRANS.',
};

async function getTestimonialsPageData(): Promise<TestimonialsPageData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'testimonials' } });
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
  const data = await getTestimonialsPageData();
  return { title: data.heading, description: data.subheading.slice(0, 160) };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getReviews(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [reviews, total, allRatings] = await Promise.all([
    prisma.review.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        order: { select: { customerName: true } },
        tour: { select: { name: true, slug: true } },
      },
    }),
    prisma.review.count({ where: { status: 'APPROVED' } }),
    prisma.review.findMany({
      where: { status: 'APPROVED' },
      select: { rating: true },
    }),
  ]);

  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

  return { reviews, total, avgRating: Math.round(avgRating * 10) / 10, allRatings };
}

export default async function TestimonialsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page) || 1) : 1;
  const { reviews, total, avgRating, allRatings } = await getReviews(page, PER_PAGE);
  const cms = await getTestimonialsPageData();
  const totalPages = Math.ceil(total / PER_PAGE);

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = allRatings.filter((r) => r.rating === star).length;
    return { star, count, percentage: total > 0 ? (count / total) * 100 : 0 };
  });

  const serializedReviews = reviews.map((review) => ({
    id: review.id,
    reviewText: review.reviewText,
    rating: review.rating,
    customerName: review.order.customerName,
    tourName: review.tour.name,
    createdAt: review.createdAt.toISOString(),
  }));

  return (
    <TestimonialsClient
      reviews={serializedReviews}
      total={total}
      avgRating={avgRating}
      distribution={distribution}
      page={page}
      totalPages={totalPages}
      cms={cms}
    />
  );
}
