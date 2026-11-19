import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatCurrency } from '@/lib/utils';
import {
  FLEET,
  HAYBALI_BRAND,
  getFleetBySlug,
} from '@/lib/haybali';
import { getFleetDetail } from '@/lib/fleet-detail';
import { getSetting, getWhatsAppNumber } from '@/lib/settings';
import FleetDetailClient from '@/components/sewa/FleetDetailClient';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Semua armada dirender saat build → kunjungan pertama langsung cepat. */
export function generateStaticParams() {
  return FLEET.map((fleet) => ({ slug: fleet.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fleet = getFleetBySlug(slug);
  const detail = getFleetDetail(slug);

  if (!fleet || !detail) {
    return { title: 'Armada tidak ditemukan' };
  }

  const description =
    `${detail.tagline} Sewa ${detail.fullName} di Bali mulai ` +
    `${formatCurrency(fleet.price12h)} per 12 jam, sudah termasuk supir dan BBM. ` +
    `${fleet.capacityLabel}.`;

  return {
    title: `Sewa ${detail.fullName} Bali + Supir`,
    description,
    alternates: { canonical: `/sewa-mobil/${fleet.slug}` },
    openGraph: {
      title: `Sewa ${detail.fullName} Bali + Supir | ${HAYBALI_BRAND}`,
      description,
      images: [{ url: fleet.imageUrl, alt: detail.fullName }],
    },
  };
}

export default async function FleetDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const fleet = getFleetBySlug(slug);
  const detail = getFleetDetail(slug);

  if (!fleet || !detail) notFound();

  const [waNumber, bankAccounts] = await Promise.all([
    getWhatsAppNumber(),
    getSetting<{ bank: string; number: string; name: string }[]>('bank_accounts', []),
  ]);
  const bankLabel = bankAccounts
    .map((account) => account.bank)
    .filter(Boolean)
    .join(' / ');

  return (
    <FleetDetailClient
      fleet={fleet}
      detail={detail}
      waNumber={waNumber}
      bankLabel={bankLabel}
    />
  );
}
