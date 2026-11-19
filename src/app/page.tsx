import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getPaymentGateway, getWhatsAppNumber } from '@/lib/settings';
import { getSiteTitle } from '@/lib/brand';
import HomeClient from '@/components/home/HomeClient';

export const revalidate = 300;

const HOME_DESCRIPTION =
  'Sewa mobil Bali dengan supir profesional. Armada Innova Zenix, Alphard, hingga Hiace Commuter. ' +
  'Harga transparan sudah termasuk supir dan BBM, booking online cepat.';

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle();
  return {
    title: { absolute: title },
    description: HOME_DESCRIPTION,
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description: HOME_DESCRIPTION,
      url: '/',
      images: [
        { url: '/images/haybali/hero-banner-v2.jpg', alt: 'HAYBALI TRANS — Sewa Mobil Bali + Supir' },
      ],
    },
  };
}

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
