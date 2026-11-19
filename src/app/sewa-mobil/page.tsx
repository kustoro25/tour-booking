import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { getWhatsAppNumber } from '@/lib/settings';
import SewaMobilClient from '@/components/sewa/SewaMobilClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Sewa Mobil Bali + Supir — Armada & Harga',
  description:
    'Daftar armada sewa mobil Bali dengan supir: Innova Zenix, Alphard, Hiace Commuter. Harga transparan sudah termasuk supir dan BBM, booking online cepat.',
  alternates: { canonical: '/sewa-mobil' },
  openGraph: {
    title: 'Sewa Mobil Bali + Supir — Armada & Harga | HAYBALI TRANS',
    description:
      'Daftar armada sewa mobil Bali dengan supir: Innova Zenix, Alphard, Hiace Commuter. Harga transparan sudah termasuk supir dan BBM, booking online cepat.',
    url: '/sewa-mobil',
    images: [
      { url: '/images/haybali/hero-banner-v2.jpg', alt: 'Armada Sewa Mobil Bali HAYBALI TRANS' },
    ],
  },
};

async function getFleetTours() {
  const tours = await prisma.tour.findMany({
    where: { isActive: true, category: 'CAR_RENTAL' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, priceAdult: true, coverImg: true },
  });
  return tours;
}

export default async function SewaMobilPage() {
  const [fleetTours, waNumber] = await Promise.all([
    getFleetTours(),
    getWhatsAppNumber(),
  ]);

  return <SewaMobilClient fleetTours={fleetTours} waNumber={waNumber} />;
}
