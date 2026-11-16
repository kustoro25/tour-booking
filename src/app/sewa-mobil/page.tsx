import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { getPaymentGateway, getWhatsAppNumber } from '@/lib/settings';
import SewaMobilClient from '@/components/sewa/SewaMobilClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Sewa Mobil & Tour Bali',
  description:
    'Sewa mobil mewah dengan supir di Bali. Supir berpengalaman, kendaraan prima, harga transparan, dan booking online cepat.',
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
  const [fleetTours, waNumber, gateway] = await Promise.all([
    getFleetTours(),
    getWhatsAppNumber(),
    getPaymentGateway(),
  ]);

  return <SewaMobilClient fleetTours={fleetTours} waNumber={waNumber} gateway={gateway} />;
}
