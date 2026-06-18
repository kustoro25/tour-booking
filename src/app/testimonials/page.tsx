import { prisma } from '@/lib/prisma';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

async function getReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { customerName: true } },
      tour: { select: { name: true, slug: true } },
    },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return { reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length };
}

export default async function TestimonialsPage() {
  const { reviews, avgRating, total } = await getReviews();

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, percentage: total > 0 ? (count / total) * 100 : 0 };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Testimoni</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Cerita dari Mereka yang Telah Berpetualang
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan serunya liburan tanpa beban bersama Jelajah Nusantara.
        </p>
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 border border-blue-100">
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-extrabold gradient-text">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="md" />
            <p className="text-sm text-gray-500 mt-2 font-medium">{total} review</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-right text-gray-600 font-medium">{d.star} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-500 text-xs">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-card p-6 border border-gray-100 hover-lift">
              <div className="text-4xl text-blue-200 mb-2 leading-none">&ldquo;</div>
              <StarRating rating={review.rating} size="sm" />
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                {review.reviewText}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">{review.order.customerName}</p>
                <p className="text-xs text-gray-500">{review.tour.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-card border border-gray-100">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-gray-600 font-medium">Belum ada testimoni.</p>
          <p className="text-sm text-gray-400 mt-1">Jadilah yang pertama memberikan ulasan!</p>
        </div>
      )}

      <div className="text-center mt-12">
        <Button href="/tours" variant="primary" size="lg">
          Lihat Semua Paket Wisata
        </Button>
      </div>
    </div>
  );
}
