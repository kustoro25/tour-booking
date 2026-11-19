'use client';

// ============================================================================
// FleetDetailClient — renderer klien halaman /sewa-mobil/[slug]. Teks dari
// kamus i18n (id/en); data armada & konten deskriptif dari server (ISR).
// ============================================================================

import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { FleetItem } from '@/lib/haybali';
import type { FleetDetail } from '@/lib/fleet-detail';
import {
  DRIVER_POLICY,
  FLEET,
  HAYBALI_BRAND,
  PICKUP_ZONES,
  REMOTE_AREA_FEES,
  STANDARD_AREAS,
  formatPickupWindow12h,
  formatTime12h,
  waLink,
} from '@/lib/haybali';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface FleetDetailClientProps {
  fleet: FleetItem;
  detail: FleetDetail;
  waNumber: string;
  bankLabel: string;
}

const REGION_COLORS: Record<string, string> = {
  'Bali Utara': 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
  'Bali Tengah-Utara': 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  'Bali Timur': 'bg-gold-400/15 text-gold-200 border border-gold-500/30',
  'Bali Barat': 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
};

export default function FleetDetailClient({ fleet, detail, waNumber, bankLabel }: FleetDetailClientProps) {
  const { t, tOr, listOr, formatPrice } = useI18n();
  useTranslatedMeta(t('meta.fleetDetail', { name: detail.fullName }), t('meta.fleetDetailDesc', { name: detail.fullName }));

  const carKey = `fleetDetail.cars.${fleet.slug}`;
  const tagline = tOr(`${carKey}.tagline`, detail.tagline);
  const overview = listOr(`${carKey}.overview`, detail.overview);
  const highlights = listOr(`${carKey}.highlights`, detail.highlights);
  const interiorFeatures = listOr(`${carKey}.interiorFeatures`, detail.interiorFeatures);
  const included = listOr('fleetDetail.common.included', detail.included);
  const excluded = listOr('fleetDetail.common.excluded', detail.excluded);

  const bookingHref = `/sewa-mobil/${fleet.slug}/booking`;
  const otherFleet = FLEET.filter((f) => f.slug !== fleet.slug).slice(0, 3);

  const regionGroups = REMOTE_AREA_FEES.reduce<Record<string, typeof REMOTE_AREA_FEES>>((acc, area) => {
    acc[area.region] = acc[area.region] ? [...acc[area.region], area] : [area];
    return acc;
  }, {});

  const specValue = (key: keyof typeof detail, labelKey: string) => ({
    label: t(`fleetDetail.common.specs.${labelKey}`),
    value: tOr(`${carKey}.specs.${labelKey}`, String(detail[key])),
  });

  const specs = [
    specValue('brand', 'brand'),
    specValue('model', 'model'),
    specValue('bodyType', 'bodyType'),
    specValue('year', 'year'),
    specValue('seatConfig', 'seatConfig'),
    specValue('fuel', 'fuel'),
    specValue('transmission', 'transmission'),
    specValue('color', 'color'),
    specValue('luggage', 'luggage'),
  ];

  return (
    <div className="bg-ink-900">
      {/* ================= HERO ================= */}
      <section className="bg-ink-950 border-b border-ink-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
          <nav aria-label={t('fleetDetail.common.breadcrumb')} className="text-xs sm:text-sm text-mist-dim mb-6 flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-gold-300 transition-colors">{t('nav.home')}</Link>
            <span>/</span>
            <Link href="/sewa-mobil" className="hover:text-gold-300 transition-colors">{t('nav.carRental')}</Link>
            <span>/</span>
            <span className="text-mist">{detail.fullName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Foto utama */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-ink-700 shadow-card bg-ink-900">
              <Image
                src={fleet.imageUrl}
                alt={t('fleetDetail.common.imageAlt', { fullName: detail.fullName })}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <span className="absolute top-3 left-3 bg-ink-900/95 text-ivory text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                {tOr(`fleet.cars.${fleet.slug}.capacityLabel`, fleet.capacityLabel)}
              </span>
              <span className="absolute top-3 right-3 bg-gold-400 text-ink-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {fleet.tier === 'LUX' ? t('fleetDetail.common.tierLux') : t('fleetDetail.common.tierCity')}
              </span>
            </div>

            {/* Ringkasan + harga */}
            <div>
              <span className="inline-block bg-gold-400/10 text-gold-300 border border-gold-500/30 rounded-full px-4 py-1.5 text-xs sm:text-sm mb-4 tracking-wide">
                {detail.brand} • {detail.model}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 text-ivory">
                {t('fleetDetail.common.rentTitle', { fullName: detail.fullName })}
                <span className="text-gold-400">{t('fleetDetail.common.inBali')}</span>
              </h1>
              <p className="text-mist leading-relaxed mb-6">{tagline}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
                  <p className="text-xs text-mist-dim mb-1">{t('fleetDetail.common.duration')}</p>
                  <p className="text-sm font-semibold text-ivory">
                    {fleet.price6h !== null ? t('fleetDetail.common.duration6or12') : t('fleetDetail.common.duration12')}
                  </p>
                </div>
                <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
                  <p className="text-xs text-mist-dim mb-1">{t('fleetDetail.common.capacity')}</p>
                  <p className="text-sm font-semibold text-ivory">
                    {t('fleetDetail.common.capacityValue', { pax: fleet.recommendedPax, max: fleet.maxPax })}
                  </p>
                </div>
              </div>

              <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5 mb-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    {fleet.price6h !== null && (
                      <p className="text-sm text-mist-dim mb-1">
                        {formatPrice(fleet.price6h)} <span className="text-xs">{t('fleetDetail.common.per6h')}</span>
                      </p>
                    )}
                    <p className="text-3xl font-bold text-gold-300">
                      {formatPrice(fleet.price12h)}
                      <span className="text-sm font-medium text-mist-dim"> {t('fleetDetail.common.per12h')}</span>
                    </p>
                    <p className="text-xs text-mist-dim mt-1">
                      {t('fleetDetail.common.priceNote')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-gold-400/15 text-gold-300 px-3 py-1.5 rounded-full">
                    {t('fleetDetail.common.overtimeBadge', { pct: fleet.overtimePct })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button href={bookingHref} variant="accent" size="lg" className="flex-1">
                  {t('fleetDetail.common.bookNow')}
                </Button>
                <Button
                  href={waLink(t('fleetDetail.common.waAskMessage', { brand: HAYBALI_BRAND, fullName: detail.fullName }), waNumber)}
                  variant="outline"
                  size="lg"
                  className="flex-1 !border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10"
                  target="_blank"
                >
                  {t('fleetDetail.common.chatWa')}
                </Button>
              </div>
              <p className="text-xs text-mist-dim mt-3">
                {t('fleetDetail.common.depositNote')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= IKHTISAR & KEUNGGULAN ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ivory mb-4">{t('fleetDetail.common.overviewTitle', { model: detail.model })}</h2>
            <div className="space-y-4 text-mist leading-relaxed">
              {overview.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ivory mb-4">{t('fleetDetail.common.highlightsTitle')}</h2>
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-mist leading-relaxed">
                  <span className="text-gold-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= SPESIFIKASI & FASILITAS ================= */}
      <section className="bg-ink-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('fleetDetail.common.specEyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory">{t('fleetDetail.common.specTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-ink-900 rounded-2xl border border-ink-700 overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-700">
                  {specs.map((spec) => (
                    <tr key={spec.label}>
                      <th scope="row" className="text-left align-top px-4 sm:px-6 py-3 font-medium text-mist-dim w-2/5">
                        {spec.label}
                      </th>
                      <td className="px-4 sm:px-6 py-3 text-ivory">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-ink-900 rounded-2xl border border-ink-700 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-ivory mb-4">{t('fleetDetail.common.cabinTitle')}</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {interiorFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-mist leading-relaxed">
                    <span className="text-gold-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-ink-700 text-sm text-mist-dim leading-relaxed">
                {t('fleetDetail.common.cabinNote')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TARIF & KETENTUAN ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="text-center mb-10">
          <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('fleetDetail.common.pricingEyebrow')}</span>
          <h2 className="text-3xl font-bold text-ivory">{t('fleetDetail.common.pricingTitle')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">{t('fleetDetail.common.durationTitle')}</h3>
            <ul className="space-y-2 text-sm text-mist">
              {fleet.price6h !== null && (
                <li className="flex justify-between gap-3">
                  <span>{t('fleetDetail.common.pkg6')}</span>
                  <span className="font-semibold text-gold-300 whitespace-nowrap">{formatPrice(fleet.price6h)}</span>
                </li>
              )}
              <li className="flex justify-between gap-3">
                <span>{t('fleetDetail.common.pkg12')}</span>
                <span className="font-semibold text-gold-300 whitespace-nowrap">{formatPrice(fleet.price12h)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>{t('fleetDetail.common.overtime')}</span>
                <span className="font-semibold text-ivory whitespace-nowrap">{t('fleetDetail.common.overtimeValue', { pct: fleet.overtimePct })}</span>
              </li>
            </ul>
            <p className="text-xs text-mist-dim mt-4">
              {t('fleetDetail.common.perCarNote')}
            </p>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">{t('fleetDetail.common.paymentTitle')}</h3>
            <ul className="space-y-2 text-sm text-mist leading-relaxed">
              <li>{t('fleetDetail.common.payDeposit')}</li>
              <li>{t('fleetDetail.common.payCash')}</li>
              <li>
                {t('fleetDetail.common.payBank', { banks: bankLabel ? ` (${bankLabel})` : '' })}
              </li>
              <li>{t('fleetDetail.common.payProof')}</li>
              <li>{t('fleetDetail.common.payDeadline')}</li>
            </ul>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">{t('fleetDetail.common.driverTitle')}</h3>
            <ul className="space-y-2 text-sm text-mist leading-relaxed">
              <li>
                {t('fleetDetail.common.driverHours', {
                  start: formatTime12h(DRIVER_POLICY.workStart),
                  end: formatTime12h(DRIVER_POLICY.workEnd),
                })}
              </li>
              <li>
                {t('fleetDetail.common.driverWindow', {
                  window: formatPickupWindow12h(),
                  fee: formatPrice(DRIVER_POLICY.latePickupFee),
                })}
              </li>
              <li>
                {t('fleetDetail.common.driverOvernight', {
                  fee: formatPrice(DRIVER_POLICY.driverAccommodation),
                })}
              </li>
              <li>{t('fleetDetail.common.driverCancel')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= TERMASUK / TIDAK TERMASUK ================= */}
      <section className="bg-ink-950 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('fleetDetail.common.inclEyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory">{t('fleetDetail.common.inclTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6">
              <h3 className="font-semibold text-green-200 mb-4">{t('fleetDetail.common.includedTitle')}</h3>
              <ul className="space-y-2 text-sm text-green-100">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5">✓</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6">
              <h3 className="font-semibold text-rose-200 mb-4">{t('fleetDetail.common.excludedTitle')}</h3>
              <ul className="space-y-2 text-sm text-rose-100">
                {excluded.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AREA JEMPUT & AREA TERPENCIL ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="text-center mb-10">
          <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('fleetDetail.common.areaEyebrow')}</span>
          <h2 className="text-3xl font-bold text-ivory">{t('fleetDetail.common.areaTitle')}</h2>
          <p className="text-mist-dim max-w-2xl mx-auto mt-3">
            {t('fleetDetail.common.areaDescA')}
            <strong>{t('fleetDetail.common.areaDescStrong')}</strong>
            {t('fleetDetail.common.areaDescB')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6">
            <h3 className="font-semibold text-green-200 mb-3">{t('fleetDetail.common.standardTitle')}</h3>
            <ul className="space-y-1.5 text-sm text-green-200">
              {STANDARD_AREAS.map((area) => (
                <li key={area.id} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> <span>{tOr(`sewa.standardAreas.${area.id}`, area.label)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-ink-850 border border-ink-700 rounded-2xl p-6">
            <h3 className="font-semibold text-ivory mb-3">{t('fleetDetail.common.freeZonesTitle')}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-mist">
              {PICKUP_ZONES.map((zone) => (
                <li key={zone} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> <span>{tOr(`sewa.pickupZones.${zone}`, zone)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mist-dim mt-4">
              {t('fleetDetail.common.freeZonesNote')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(regionGroups).map(([region, areas]) => (
            <div key={region} className="bg-ink-850 border border-ink-700 rounded-2xl p-5">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${REGION_COLORS[region] || 'bg-ink-700 text-mist'}`}>
                {tOr(`sewa.regions.${region}`, region)}
              </span>
              <ul className="space-y-3">
                {areas.map((area) => (
                  <li key={area.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-mist">{area.label}</span>
                    <span className="font-bold text-gold-300 whitespace-nowrap">+{formatPrice(area.fee)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-mist-dim text-center mt-6 max-w-3xl mx-auto leading-relaxed">
          {t('fleetDetail.common.remoteNote')}
        </p>
      </section>

      {/* ================= ARMADA LAIN ================= */}
      <section className="bg-ink-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('fleetDetail.common.otherEyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory">{t('fleetDetail.common.otherTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {otherFleet.map((car) => (
              <Link
                key={car.slug}
                href={`/sewa-mobil/${car.slug}`}
                className="group bg-ink-850 rounded-2xl overflow-hidden border border-ink-700 shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={car.imageUrl}
                    alt={car.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-3 left-3 bg-ink-900/95 text-ivory text-xs font-semibold px-2.5 py-1 rounded-full">
                    {tOr(`fleet.cars.${car.slug}.capacityLabel`, car.capacityLabel)}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-ivory mb-1">{car.name}</h3>
                  <p className="text-gold-300 font-bold mb-3">
                    {formatPrice(car.price12h)}
                    <span className="text-xs font-medium text-mist-dim"> {t('fleetDetail.common.per12h')}</span>
                  </p>
                  <span className="mt-auto text-sm font-semibold text-gold-300 group-hover:text-gold-200">
                    {t('fleetDetail.common.viewDetail')}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button href="/sewa-mobil" variant="outline" size="md">
              {t('fleetDetail.common.viewAll')}
            </Button>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative py-16 bg-ink-900 border-y border-gold-500/25 text-ivory overflow-hidden">
        <div className="absolute inset-0 gold-panel" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('fleetDetail.common.ctaTitle', { fullName: detail.fullName })}</h2>
          <p className="text-mist mb-8">
            {t('fleetDetail.common.ctaDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href={bookingHref} variant="accent" size="lg">
              {t('fleetDetail.common.ctaBook')}
            </Button>
            <Button
              href={waLink(t('fleetDetail.common.waConsultMessage', { brand: HAYBALI_BRAND, fullName: detail.fullName }), waNumber)}
              variant="outline"
              size="lg"
              className="!border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10"
              target="_blank"
            >
              {t('fleetDetail.common.chatWa')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
