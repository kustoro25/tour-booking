import { prisma } from '@/lib/prisma';
import { getPaymentGateway, getWhatsAppNumber } from '@/lib/settings';
import HomeClient from '@/components/home/HomeClient';

export const revalidate = 300;

async function getLatestReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { order: { select: { customerName: true } }, tour: { select: { name: true } } },
  });
  // Serialisasi ke bentuk polos agar aman dikirim ke komponen klien.
  return reviews.map((review) => ({
    id: review.id,
    reviewText: review.reviewText,
    rating: review.rating,
    customerName: review.order.customerName,
    tourName: review.tour.name,
  }));
}

export default async function HomePage() {
  const [reviews, waNumber, gateway] = await Promise.all([
    getLatestReviews(),
    getWhatsAppNumber(),
    getPaymentGateway(),
  ]);

  return <HomeClient reviews={reviews} waNumber={waNumber} gateway={gateway} />;
}
