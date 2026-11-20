'use client';

// ============================================================================
// HomeClient — renderer klien halaman beranda. Teks berasal dari kamus i18n
// (id/en) sehingga seluruh konten mengikuti tombol bahasa di header.
// Data (review, nomor WA, gateway) diambil server-side oleh page.tsx (ISR).
// ============================================================================

import { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import DestinasiGallery from '@/components/tours/DestinasiGallery';
import GalleryLightbox from '@/components/tours/GalleryLightbox';
import { HAYBALI_BRAND, FLEET, waLink } from '@/lib/haybali';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface HomeReview {
  id: string;
  reviewText: string;
  rating: number;
  customerName: string;
  tourName: string;
  adminReply: string | null;
  photos: string;
}

/** Parse kolom photos (JSON string) menjadi array URL yang aman. */
function parsePhotos(photos: string): string[] {
  try {
    const parsed = JSON.parse(photos);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.length > 0);
  } catch {
    return [];
  }
}

interface HomeClientProps {
  reviews: HomeReview[];
  waNumber: string;
}

// Ikon & warna kartu nilai (data visual, bukan teks — tidak perlu diterjemahkan).
const VALUE_ICONS = ['🚙', '👨‍✈️', '💰', '⚡'];
const VALUE_COLORS = [
  'from-gold-200 via-gold-400 to-gold-600',
  'from-gold-300 to-gold-700',
  'from-ink-600 to-ink-800',
  'from-gold-400 to-gold-600',
];

interface FaqItem {
  question: string;
  answer: string;
}

interface DestinationItem {
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

const DESTINATION_IMAGES: Record<string, string> = {
  Ubud: '/images/haybali/destinasi-ubud.jpg',
  Bedugul: '/images/haybali/destinasi-bedugul.jpg',
  Kintamani: '/images/haybali/destinasi-kintamani.jpg',
  'Nusa Penida': '/images/haybali/destinasi-nusa-penida.jpg',
  Uluwatu: '/images/haybali/destinasi-uluwatu.jpg',
};

export default function HomeClient({ reviews, waNumber }: HomeClientProps) {
  const { t, list, formatPrice } = useI18n();
  useTranslatedMeta(t('meta.home'), t('meta.homeDesc'));

  // Lightbox foto review: klik thumbnail membuka viewer internal, bukan URL asli.
  const [lightboxPhotos, setLightboxPhotos] = useState<{ url: string; alt: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const stats = list('home.stats') as { num: string; label: string }[];
  const aboutParagraphs = list('home.about.paragraphs') as string[];
  const values = list('home.values') as { title: string; desc: string }[];
  const destinations = (list('home.destinations') as Omit<DestinationItem, 'imageUrl'>[]).map((d) => ({
    ...d,
    imageUrl: DESTINATION_IMAGES[d.name] || '/images/haybali/destinasi-ubud.jpg',
  }));
  const faqItems = list('home.faq.items') as FaqItem[];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-gold-500/20 bg-ink-950">
        <h1 className="sr-only">HAYBALI TRANS – Luxury Transport in Bali</h1>
        {/* Banner tampil utuh (tanpa crop) dan responsif mengikuti lebar layar */}
        <Image
          src="/images/haybali/hero-banner-v2.jpg"
          alt="HAYBALI TRANS – Luxury Transport in Bali"
          width={1280}
          height={512}
          priority
          sizes="100vw"
          className="block w-full h-auto"
        />
        {/* Bar CTA singkat di bawah banner agar tombol booking tetap mudah diakses */}
        <div className="border-t border-gold-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-center sm:justify-between gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/sewa-mobil" variant="accent" size="md">
                {t('nav.bookNow')}
              </Button>
              <Button href={waLink(t('home.waHeroMessage'), waNumber)} variant="outline" size="md" className="!border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10">
                {t('home.heroChatWa')}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-gold-300">{stat.num}</p>
                  <p className="text-xs text-mist-dim">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN ================= */}
      <section className="py-16 sm:py-20 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* ABOUT HAYBALI TRANS — di atas tulisan "Mengapa Memilih Kami?" */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-3">
              {t('home.about.eyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ivory mb-3">
              {t('home.about.title')}
            </h2>
            <p className="text-gold-200/90 mb-6">
              {t('home.about.subtitle')}
            </p>
            <div className="text-mist leading-relaxed space-y-4">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="text-gold-200 font-semibold">
                {t('home.about.closing')}
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.why.eyebrow')}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ivory mb-4">{t('home.why.title')}</h2>
            <p className="text-mist-dim max-w-2xl mx-auto">
              {t('home.why.desc')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {values.map((item, index) => (
              <div key={item.title} className="group bg-ink-850 rounded-xl p-3 sm:p-6 shadow-card hover-lift text-center border border-ink-700 hover:border-gold-500/20 transition-colors">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-xl bg-gradient-to-br ${VALUE_COLORS[index % VALUE_COLORS.length]} flex items-center justify-center text-xl sm:text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span>{VALUE_ICONS[index % VALUE_ICONS.length]}</span>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-ivory mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-mist-dim text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARMADA ================= */}
      <section className="py-16 sm:py-20 bg-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.fleetSection.eyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory mb-4">{t('home.fleetSection.title')}</h2>
            <p className="text-mist-dim max-w-2xl mx-auto">
              {t('home.fleetSection.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLEET.map((car) => {
              const fleetKey = `fleet.cars.${car.slug}`;
              const features = list(`${fleetKey}.features`) as string[];
              return (
                <div key={car.slug} className="group bg-ink-850 rounded-xl overflow-hidden shadow-card hover-lift">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={car.imageUrl}
                      alt={car.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 bg-ink-900/95 text-ivory text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {t(`${fleetKey}.capacityLabel`)}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-ivory">{car.name}</h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          car.tier === 'LUX' ? 'bg-gold-400/15 text-gold-300' : 'bg-ink-700 text-mist'
                        }`}
                      >
                        {car.tier}
                      </span>
                    </div>
                    <div className="mb-2">
                      {car.price6h !== null && (
                        <p className="text-sm text-mist-dim">
                          {formatPrice(car.price6h)}{' '}
                          <span className="text-xs text-mist-dim">{t('home.fleetSection.per6h')}</span>
                        </p>
                      )}
                      <p className="text-xl font-bold text-gold-300">
                        {formatPrice(car.price12h)}{' '}
                        <span className="text-sm font-normal text-mist-dim">{t('home.fleetSection.per12h')}</span>
                      </p>
                    </div>
                    <p className="text-xs text-mist-dim mb-1">
                      {t('home.fleetSection.overtime', { pct: car.overtimePct })}
                    </p>
                    <p className="text-xs text-mist-dim mb-3">{t(`${fleetKey}.paxNote`)}</p>
                    <ul className="space-y-1.5 mb-4">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-mist">
                          <span className="text-gold-400">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button href={`/sewa-mobil/${car.slug}/booking`} variant="primary" size="sm" className="flex-1">
                        {t('home.fleetSection.rentNow')}
                      </Button>
                      <Button href={`/sewa-mobil/${car.slug}`} variant="outline" size="sm" className="flex-1">
                        {t('home.fleetSection.details')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= GALERI DESTINASI ================= */}
      <section id="destinasi" className="scroll-mt-20 py-16 sm:py-20 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.gallery.eyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory mb-4">{t('home.gallery.title')}</h2>
            <p className="text-mist-dim max-w-2xl mx-auto">
              {t('home.gallery.desc')}
            </p>
          </div>

          <DestinasiGallery destinations={destinations} />
        </div>
      </section>

      {/* ================= KEBIJAKAN ================= */}
      <section className="py-16 sm:py-20 bg-ink-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.policy.eyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory mb-4">{t('home.policy.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ink-900 rounded-xl p-6 border border-ink-700">
              <h3 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gold-400/15 text-gold-300 rounded-lg flex items-center justify-center">💳</span>
                {t('home.policy.paymentTitle')}
              </h3>
              <ul className="space-y-3 text-sm text-mist leading-relaxed">
                <li>{t('home.policy.paymentItems.manual')}</li>
                <li>{t('home.policy.paymentItems.deposit')}</li>
                <li>{t('home.policy.paymentItems.deadline')}</li>
              </ul>
            </div>
            <div className="bg-ink-900 rounded-xl p-6 border border-ink-700">
              <h3 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gold-400/15 text-gold-300 rounded-lg flex items-center justify-center">📋</span>
                {t('home.policy.termsTitle')}
              </h3>
              <ul className="space-y-3 text-sm text-mist leading-relaxed">
                <li>{t('home.policy.termsItems.clearData')}</li>
                <li>{t('home.policy.termsItems.cancel')}</li>
                <li>{t('home.policy.termsItems.delay')}</li>
                <li>{t('home.policy.termsItems.hours')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-20 bg-ink-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.testimonials.eyebrow')}</span>
              <h2 className="text-3xl font-bold text-ivory mb-4">{t('home.testimonials.title')}</h2>
              <p className="text-mist-dim max-w-2xl mx-auto">
                {t('home.testimonials.desc')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => {
                const photos = parsePhotos(review.photos);
                return (
                  <div key={review.id} className="bg-ink-850 rounded-xl p-6 shadow-card hover-lift border border-ink-700">
                    <div className="text-4xl text-gold-600/60 mb-2 leading-none">&ldquo;</div>
                    <StarRating rating={review.rating} size="sm" />
                    <p className="text-mist mt-3 text-sm leading-relaxed line-clamp-4">
                      {review.reviewText}
                    </p>

                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {photos.map((url, idx) => (
                          <button
                            key={url}
                            type="button"
                            className="cursor-zoom-in"
                            title={t('testimonials.viewPhoto')}
                            onClick={() => {
                              setLightboxPhotos(photos.map((p) => ({ url: p, alt: t('testimonials.photoAlt') })));
                              setLightboxIndex(idx);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- foto review dari upload Cloudinary */}
                            <img
                              src={url}
                              alt={t('testimonials.photoAlt')}
                              className="w-14 h-14 object-cover rounded-lg border border-ink-600 hover:opacity-80 transition-opacity"
                              loading="lazy"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-ink-700">
                      <p className="font-semibold text-ivory text-sm">{review.customerName}</p>
                      <p className="text-xs text-mist-dim">{review.tourName}</p>
                    </div>

                    {review.adminReply ? (
                      <div className="mt-3 bg-ink-800 border border-gold-500/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gold-300 mb-1">↩️ {t('home.testimonials.adminReply')}</p>
                        <p className="text-sm text-mist line-clamp-3">{review.adminReply}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Button href="/testimonials" variant="outline">
                {t('home.testimonials.viewAll')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ================= FAQ ================= */}
      <section className="py-16 sm:py-20 bg-ink-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('home.faq.eyebrow')}</span>
            <h2 className="text-3xl font-bold text-ivory mb-4">{t('home.faq.title')}</h2>
            <p className="text-mist-dim max-w-2xl mx-auto">
              {t('home.faq.desc')}
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <details
                key={index}
                className="bg-ink-850 rounded-xl shadow-card group overflow-hidden border border-ink-700 hover:border-gold-500/20 transition-colors"
              >
                <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-ivory hover:text-gold-300 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-gold-400/10 text-gold-300 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {faq.question}
                  </span>
                  <svg
                    className="w-5 h-5 text-mist-dim group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-5 sm:px-6 pb-5 text-mist leading-relaxed text-sm sm:text-base border-t border-ink-700 pt-4 ml-14 sm:ml-16">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA KONTAK ================= */}
      <section className="relative py-16 sm:py-20 bg-ink-900 border-y border-gold-500/25 text-ivory overflow-hidden">
        <div className="absolute inset-0 gold-panel" />
        <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] blob bg-gold-400/10 animate-float" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] blob bg-gold-400/10 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {t('home.cta.title', { brand: HAYBALI_BRAND })}
          </h2>
          <p className="text-mist mb-8 text-lg max-w-2xl mx-auto">
            {t('home.cta.desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button href="/sewa-mobil" variant="accent" size="lg">
              {t('home.cta.rentNow')}
            </Button>
            <Button href={waLink(t('home.cta.waConsultMessage'), waNumber)} variant="outline" size="lg" className="!border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10">
              {t('home.cta.chatWa')}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-mist-dim">
            <span>{t('home.cta.address')}</span>
            <span>{t('home.cta.phone')}</span>
            <span>{t('home.cta.email')}</span>
          </div>
        </div>
      </section>

      {/* Viewer foto review (lightbox) — klik thumbnail tidak lagi membuka URL asli */}
      <GalleryLightbox
        images={lightboxPhotos}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        disableContextMenu
      />
    </>
  );
}
