'use client';

// ============================================================================
// SewaMobilClient — renderer klien halaman /sewa-mobil. Teks dari kamus i18n,
// data armada (tour + harga) dari server (ISR) lewat props.
// ============================================================================

import Image from 'next/image';
import Button from '@/components/ui/Button';
import {
  HAYBALI_BRAND,
  FLEET,
  REMOTE_AREA_FEES,
  STANDARD_AREAS,
  PICKUP_ZONES,
  DRIVER_POLICY,
  formatPickupWindow12h,
  formatTime12h,
  waLink,
} from '@/lib/haybali';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface FleetTour {
  id: string;
  name: string;
  slug: string;
  priceAdult: number;
  coverImg: string | null;
}

interface SewaMobilClientProps {
  fleetTours: FleetTour[];
  waNumber: string;
}

const REGION_COLORS: Record<string, string> = {
  'Bali Utara': 'bg-sky-500/15 text-sky-200',
  'Bali Tengah-Utara': 'bg-emerald-500/15 text-emerald-300',
  'Bali Timur': 'bg-purple-500/15 text-purple-300',
  'Bali Barat': 'bg-gold-400/15 text-gold-300',
};

export default function SewaMobilClient({ fleetTours, waNumber }: SewaMobilClientProps) {
  const { t, tOr, formatPrice } = useI18n();
  useTranslatedMeta(t('meta.sewa'), t('meta.sewaDesc'));

  const regionGroups = REMOTE_AREA_FEES.reduce<Record<string, typeof REMOTE_AREA_FEES>>((acc, area) => {
    (acc[area.region] ||= []).push(area);
    return acc;
  }, {});

  return (
    <div className="bg-ink-900">
      {/* Hero HAYBALI TRANS */}
      <section className="bg-ink-950 border-b border-ink-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24">
          <span className="inline-block bg-gold-400/10 text-gold-300 border border-gold-500/30 rounded-full px-4 py-1.5 text-sm mb-4 tracking-wide">
            {t('sewa.badge')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-2xl text-ivory">
            {t('sewa.heroTitle1')}
            <span className="text-gold-400">{t('sewa.heroTitle2')}</span>
          </h1>
          <p className="text-mist text-base sm:text-lg mb-4 max-w-2xl leading-relaxed">
            {t('sewa.heroP1a')}
            <strong>{t('sewa.heroP1strong')}</strong>
            {t('sewa.heroP1b')}
          </p>
          <p className="text-mist text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
            {t('sewa.heroP2a')}
            <strong>{t('sewa.heroP2strong')}</strong>
            {t('sewa.heroP2b')}
            <a
              href={waLink(t('sewa.waBookingMessage', { brand: HAYBALI_BRAND }), waNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-300 font-semibold underline hover:text-gold-300"
            >
              {t('sewa.heroP2link')}
            </a>
            {t('sewa.heroP2c')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="#armada" variant="accent" size="lg">
              {t('sewa.seeFleet')}
            </Button>
            <Button
              href={waLink(t('sewa.waPriceMessage', { brand: HAYBALI_BRAND }), waNumber)}
              variant="outline"
              size="lg"
              className="!border-ink-600 !text-mist hover:!bg-ink-900"
              target="_blank"
            >
              {t('sewa.chatWa')}
            </Button>
          </div>
        </div>
      </section>

      {/* Armada */}
      <section id="armada" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('sewa.fleetEyebrow')}</span>
          <h2 className="text-3xl font-bold text-ivory mb-3">{t('sewa.fleetTitle')}</h2>
          <p className="text-mist-dim max-w-2xl mx-auto">
            {t('sewa.fleetDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {fleetTours.map((tour) => {
            const fleet = FLEET.find((f) => f.slug === tour.slug);
            const image = tour.coverImg || fleet?.imageUrl;
            const fleetKey = `fleet.cars.${tour.slug}`;
            return (
              <div key={tour.id} className="bg-ink-850 rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-ink-700 flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  {image && (
                    <Image
                      src={image}
                      alt={tour.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <span className="absolute top-3 left-3 bg-ink-900/95 text-ivory text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {fleet ? tOr(`${fleetKey}.capacityLabel`, fleet.capacityLabel) : ''}
                  </span>
                  {fleet && (
                    <span className="absolute top-3 right-3 bg-gold-400/95 text-ink-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {fleet.tier}
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-ivory mb-2">{tour.name}</h3>
                  <div className="mb-2">
                    {fleet?.price6h != null && (
                      <p className="text-sm text-mist-dim">
                        {formatPrice(fleet.price6h)}
                        <span className="text-xs text-mist-dim"> {t('sewa.per6h')}</span>
                      </p>
                    )}
                    <p className="text-gold-300 font-bold text-2xl">
                      {formatPrice(fleet?.price12h ?? tour.priceAdult)}
                      <span className="text-mist-dim text-sm font-medium"> {t('sewa.per12h')}</span>
                    </p>
                  </div>
                  <p className="text-xs text-mist-dim mb-1">
                    {t('sewa.overtime', { pct: fleet?.overtimePct ?? 10 })}
                  </p>
                  <p className="text-xs text-mist-dim mb-3">{fleet ? tOr(`${fleetKey}.paxNote`, fleet.paxNote) : ''}</p>
                  <ul className="space-y-1.5 text-sm text-mist mb-6 flex-1">
                    {(fleet?.features || []).map((feat, i) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>{' '}
                        {tOr(`${fleetKey}.features.${i}`, feat)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button href={`/sewa-mobil/${tour.slug}/booking`} variant="primary" className="flex-1">
                      {t('sewa.bookThis')}
                    </Button>
                    <Button href={`/sewa-mobil/${tour.slug}`} variant="outline" className="flex-1">
                      {t('sewa.details')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {fleetTours.length === 0 && (
            <div className="col-span-full text-center py-12 text-mist-dim">
              {t('sewa.emptyFleet')}
            </div>
          )}
        </div>
      </section>

      {/* Kebijakan Daerah Terpencil */}
      <section className="bg-ink-950 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-400 text-sm font-semibold tracking-wide uppercase mb-2">{t('sewa.remote.eyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory mb-3">{t('sewa.remote.title')}</h2>
            <p className="text-mist-dim max-w-2xl mx-auto">
              {t('sewa.remote.descA')}
              <strong>{t('sewa.remote.descStrong')}</strong>
              {t('sewa.remote.descB')}
            </p>
          </div>

          {/* Area standar */}
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 mb-8">
            <h3 className="font-semibold text-green-200 mb-3">{t('sewa.remote.standardTitle')}</h3>
            <ul className="space-y-1.5 text-sm text-green-200">
              {STANDARD_AREAS.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> {tOr(`sewa.standardAreas.${a.id}`, a.label)}
                </li>
              ))}
            </ul>
          </div>

          {/* Grup area terpencil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(regionGroups).map(([region, areas]) => (
              <div key={region} className="bg-ink-900 border border-ink-700 rounded-2xl p-5">
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

          <p className="text-sm text-mist-dim mt-6 italic text-center">
            {t('sewa.remote.note')}
          </p>
        </div>
      </section>

      {/* Zona Jemput & Jam Kerja */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-ink-850 rounded-2xl shadow-card p-6 border border-ink-700">
            <h3 className="text-xl font-bold text-ivory mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span> {t('sewa.zones.title')}
            </h3>
            <ul className="space-y-2 text-mist">
              {PICKUP_ZONES.map((zone) => (
                <li key={zone} className="flex items-start gap-2">
                  <span className="text-gold-400 mt-0.5">•</span> {tOr(`sewa.pickupZones.${zone}`, zone)}
                </li>
              ))}
            </ul>
            <p className="text-sm text-mist-dim mt-4">
              {t('sewa.zones.note')}
            </p>
          </div>

          <div className="bg-ink-850 rounded-2xl shadow-card p-6 border border-ink-700">
            <h3 className="text-xl font-bold text-ivory mb-4 flex items-center gap-2">
              <span className="text-2xl">⏰</span> {t('sewa.driver.title')}
            </h3>
            <ul className="space-y-3 text-mist">
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-0.5">•</span>
                {t('sewa.driver.line1a')}
                <strong>{formatTime12h(DRIVER_POLICY.workStart)}</strong>
                {t('sewa.driver.line1mid')}
                <strong>{formatTime12h(DRIVER_POLICY.workEnd)}</strong>
                {t('sewa.driver.line1b')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-0.5">•</span>
                {t('sewa.driver.line2a')}
                {formatPickupWindow12h()}
                {t('sewa.driver.line2b')}
                <strong>{formatPrice(DRIVER_POLICY.latePickupFee)}</strong>
                {t('sewa.driver.line2c')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-0.5">•</span>
                {t('sewa.driver.line3a')}
                <strong>{formatPrice(DRIVER_POLICY.driverAccommodation)}</strong>
                {t('sewa.driver.line3b')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pembayaran & Syarat */}
      <section className="bg-ink-950 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gold-400/10 border border-gold-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gold-200 mb-3">{t('sewa.payment.title')}</h3>
            <ul className="space-y-2 text-sm text-gold-200/80">
              <li>{t('sewa.payment.deposit')}</li>
              <li>{t('sewa.payment.cash')}</li>
              <li>{t('sewa.payment.transfer')}</li>
            </ul>
          </div>
          <div className="bg-gold-400/10 border border-gold-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gold-200 mb-3">{t('sewa.terms.title')}</h3>
            <ul className="space-y-2 text-sm text-gold-200/80">
              <li>{t('sewa.terms.clearData')}</li>
              <li>{t('sewa.terms.cancel')}</li>
              <li>{t('sewa.terms.delay')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="relative py-16 bg-ink-900 border-y border-gold-500/25 text-ivory overflow-hidden">
        <div className="absolute inset-0 gold-panel" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('sewa.cta.title')}</h2>
          <p className="text-mist mb-8">
            {t('sewa.cta.desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              href={waLink(t('sewa.cta.waMessage', { brand: HAYBALI_BRAND }), waNumber)}
              variant="accent"
              size="lg"
              target="_blank"
            >
              {t('sewa.cta.button', { brand: HAYBALI_BRAND })}
            </Button>
          </div>
          <p className="text-sm text-mist-dim mt-8">
            {t('sewa.cta.footerInfo', { brand: HAYBALI_BRAND })}
          </p>
        </div>
      </section>
    </div>
  );
}
