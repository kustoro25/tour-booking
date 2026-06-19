import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, parseJsonSafe } from '@/lib/utils';
import type { ItineraryDay } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import GalleryCarousel from '@/components/tours/GalleryCarousel';
import HeroSearch from '@/components/ui/HeroSearch';

export const dynamic = 'force-dynamic';

async function getCmsFaqs(): Promise<{ question: string; answer: string }[]> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-faq' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* fallback to hardcoded */ }
  return [
    { question: 'Bagaimana cara melakukan booking?', answer: 'Caranya sangat mudah! Pilih paket tour yang Anda inginkan, tentukan tanggal keberangkatan dari kalender interaktif, isi data diri dan jumlah peserta, lalu klik "Booking Sekarang". Invoice akan langsung terbit dan dikirim ke email Anda.' },
    { question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami menerima transfer bank (BCA, Mandiri, BRI, BNI) dan e-wallet (OVO, Dana, GoPay, ShopeePay). Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika melebihi batas waktu, pesanan akan otomatis dibatalkan.' },
    { question: 'Bagaimana kebijakan pembatalan dan refund?', answer: 'Pembatalan H-14: refund 80%. H-7: refund 50%. H-3: refund 25%. Kurang dari H-3: tidak ada refund. Jika tour dibatalkan oleh kami karena force majeure atau kuota minimal tidak terpenuhi, Anda mendapat refund 100%.' },
    { question: 'Apakah ada minimal peserta untuk setiap tour?', answer: 'Ya, setiap paket tour memiliki minimal peserta (umumnya 2 orang). Informasi ini tercantum di halaman detail masing-masing paket. Jika kuota minimal tidak terpenuhi, tim kami akan menghubungi Anda untuk opsi alternatif.' },
  ];
}

async function getFeaturedTours() {
  const tours = await prisma.tour.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    take: 6,
    include: {
      _count: { select: { orders: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  return tours.map((tour) => {
    const avgRating =
      tour.reviews.length > 0
        ? tour.reviews.reduce((sum, r) => sum + r.rating, 0) / tour.reviews.length
        : 0;
    return {
      ...tour,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  });
}

async function getLatestReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { order: { select: { customerName: true } }, tour: { select: { name: true, slug: true } } },
  });
  return reviews;
}

async function getFeaturedDestinations() {
  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    orderBy: [{ highlight: 'desc' }, { sortOrder: 'asc' }],
    take: 6,
    include: { _count: { select: { tours: true } } },
  });
  return destinations;
}

interface GalleryPhoto {
  url: string;
  alt: string;
  destinationSlug: string;
  destinationName: string;
}

async function getAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, imageUrl: true, gallery: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Collect all photos per destination: imageUrl + gallery images
  const pools: { slug: string; name: string; photos: string[] }[] = [];
  for (const dest of destinations) {
    const galleryImages: string[] = parseJsonSafe(dest.gallery, []);
    const all = [dest.imageUrl, ...galleryImages].filter(Boolean);
    if (all.length > 0) {
      pools.push({ slug: dest.slug, name: dest.name, photos: all });
    }
  }

  if (pools.length === 0) return [];

  // Interleave: round-robin from each destination's photo pool
  const result: GalleryPhoto[] = [];
  const indices = new Array(pools.length).fill(0);
  let done = false;

  while (!done) {
    done = true;
    for (let i = 0; i < pools.length; i++) {
      if (indices[i] < pools[i].photos.length) {
        const photo = pools[i].photos[indices[i]];
        result.push({
          url: photo,
          alt: pools[i].name,
          destinationSlug: pools[i].slug,
          destinationName: pools[i].name,
        });
        indices[i]++;
        done = false;
      }
    }
  }

  return result;
}

async function getCmsHero() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-hero' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    tagline: '🔥 Ribuan wisatawan telah berangkat bersama kami',
    heading: 'Jelajahi Destinasi',
    headingHighlight: 'Impian',
    headingAfter: 'Anda Tanpa Ribet!',
    subheading: 'Paket tour terbaik dengan pelayanan premium, harga transparan, dan sistem booking instan. Pilih jadwalmu, amankan kursimu, dan bersiaplah untuk petualangan tak terlupakan.',
    ctaText: '🚀 Lihat Paket Wisata',
    ctaLink: '/tours',
    cta2Text: 'Booking Sekarang',
    cta2Link: '/contact',
    stats: [
      { num: '5000+', label: 'Wisatawan' },
      { num: '50+', label: 'Destinasi' },
      { num: '4.9', label: 'Rating ★' },
    ],
    bgImage: '/images/hero.png',
  };
}

async function getCmsValue() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-value' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    valueHeading: 'Mengapa Memilih Kami?',
    valueSubheading: 'Kami hadir untuk memberikan pengalaman booking tour terbaik dengan standar pelayanan premium.',
    valueItems: [
      { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Apa yang Anda lihat, itulah yang Anda bayar.', color: 'from-green-500 to-emerald-600' },
      { icon: '⚡', title: 'Booking Instan', desc: '3 langkah, 1 menit. Invoice langsung terbit dan masuk ke email Anda.', color: 'from-blue-500 to-blue-600' },
      { icon: '🎯', title: 'Guide Profesional', desc: 'Tim guide kami berpengalaman dan bersertifikat resmi.', color: 'from-purple-500 to-purple-600' },
      { icon: '🛡️', title: 'Garansi Keberangkatan', desc: 'Jadwal pasti berangkat sesuai kuota minimum yang realistis.', color: 'from-orange-500 to-orange-600' },
    ],
  };
}

async function getCmsCta() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-cta' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    heading: 'Siap untuk Petualangan Berikutnya?',
    subheading: 'Pilih paket tour favorit Anda dan booking dalam hitungan menit. Mudah, cepat, dan transparan.',
    ctaText: 'Jelajahi Paket Tour',
    ctaLink: '/tours',
    cta2Text: 'Hubungi Kami',
    cta2Link: '/contact',
  };
}

async function getCmsGallery() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-gallery' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    label: 'Jelajah Visual',
    heading: 'Sekilas Keindahan Nusantara',
    subheading: 'Dari sabana luas di timur hingga pantai eksotis di barat — lihat sendiri pesona destinasi impianmu.',
  };
}

async function getCmsTours() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-tours' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    label: 'Paket Pilihan',
    heading: 'Paket Wisata Unggulan',
    subheading: 'Temukan paket tour terbaik kami ke destinasi paling menakjubkan di Indonesia',
  };
}

async function getCmsDestinations() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'home-destinations' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    label: 'Eksplorasi',
    heading: 'Destinasi Impian,',
    subheading: 'Dari pantai eksotis berpasir putih hingga puncak gunung megah berselimut kabut — setiap sudut Nusantara menyimpan cerita yang menunggu untuk kamu buka.',
  };
}

async function getCmsTestimonials() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'testimonials' } });
    if (page?.content) return JSON.parse(page.content);
  } catch { /* fallback */ }
  return {
    label: 'Testimoni',
    heading: 'Cerita dari Mereka yang Telah Berpetualang',
    subheading: 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan serunya liburan tanpa beban bersama Jelajah Nusantara.',
    ctaText: 'Lihat Semua Testimoni',
    ctaLink: '/testimonials',
  };
}

export default async function HomePage() {
  const [tours, reviews, destinations, galleryPhotos, faqs, hero, valueData, ctaData, galleryData, toursData, destinationsData, testimonialsData] = await Promise.all([
    getFeaturedTours(),
    getLatestReviews(),
    getFeaturedDestinations(),
    getAllGalleryPhotos(),
    getCmsFaqs(),
    getCmsHero(),
    getCmsValue(),
    getCmsCta(),
    getCmsGallery(),
    getCmsTours(),
    getCmsDestinations(),
    getCmsTestimonials(),
  ]);

  const heroStats = hero.stats || [];
  const bgImage = hero.bgImage || '/images/hero.png';

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative text-white overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-teal-900/80" />
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] blob bg-white/5 animate-float" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[350px] h-[350px] blob bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[60%] w-[200px] h-[200px] rounded-full bg-white/5 animate-pulse-soft" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft" />
              <span>{hero.tagline || '🔥 Ribuan wisatawan telah berangkat bersama kami'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up drop-shadow-lg">
              {hero.heading || 'Jelajahi Destinasi'} <span className="text-orange-400">{hero.headingHighlight || 'Impian'}</span> {hero.headingAfter || 'Anda Tanpa Ribet!'}
            </h1>
            <p className="text-base sm:text-xl text-white/90 mb-6 leading-relaxed animate-fade-in-up animate-delay-200 drop-shadow">
              {hero.subheading || 'Paket tour terbaik dengan pelayanan premium, harga transparan, dan sistem booking instan.'}
            </p>

            {/* Search Bar */}
            <div className="mb-8 animate-fade-in-up animate-delay-250 relative z-10">
              <HeroSearch />
            </div>
            <div className="flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <Button href={hero.ctaLink || '/tours'} variant="accent" size="lg">
                {hero.ctaText || '🚀 Lihat Paket Wisata'}
              </Button>
              <Button href={hero.cta2Link || '/contact'} variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
                {hero.cta2Text || 'Booking Sekarang'}
              </Button>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-white/15 animate-fade-in-up animate-delay-400">
              {heroStats.map((stat: { num: string; label: string }) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.num}</p>
                  <p className="text-sm text-blue-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{valueData.valueHeading || 'Mengapa Memilih Kami?'}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">{valueData.valueSubheading || 'Kami hadir untuk memberikan pengalaman booking tour terbaik.'}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {(valueData.valueItems || []).map((item: { icon: string; title: string; desc: string; color: string }, i: number) => (
              <div key={item.title} className="group bg-white rounded-xl p-3 sm:p-6 shadow-card hover-lift text-center border border-gray-100 hover:border-blue-100 transition-colors">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-xl bg-gradient-to-br ${item.color || 'from-blue-500 to-blue-600'} flex items-center justify-center text-xl sm:text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span>{item.icon}</span>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Showcase */}
      {destinations.length > 0 && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 via-white to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">{destinationsData.label || 'Eksplorasi'}</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {destinationsData.heading || 'Destinasi Impian,'}{' '}
                <span className="gradient-text">Satu Klik Saja</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {destinationsData.subheading || 'Dari pantai eksotis berpasir putih hingga puncak gunung megah berselimut kabut — setiap sudut Nusantara menyimpan cerita yang menunggu untuk kamu buka.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {destinations.map((dest) => {
                return (
                  <Link
                    key={dest.id}
                    href={`/destinations/${dest.slug}`}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover-lift border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      <Image
                        src={dest.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                        alt={dest.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {/* Rating badge */}
                      <div className="absolute top-3 right-3 glass backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">{dest.rating.toFixed(1)}</span>
                      </div>
                      {/* Name & Location overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                        <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {dest.location}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight group-hover:text-orange-300 transition-colors pr-16">
                          {dest.name}
                        </h3>
                      </div>
                      {/* View button */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-blue-600 text-sm font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors">
                          View
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </div>
                      {/* Highlight badge */}
                      {dest.highlight && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          ⭐ Unggulan
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Button href={destinationsData.ctaLink || '/destinations'} variant="primary" size="lg">
                {destinationsData.ctaText || 'Lihat Semua Destinasi'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Tours */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">{toursData.label || 'Paket Pilihan'}</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{toursData.heading || 'Paket Wisata Unggulan'}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {toursData.subheading || 'Temukan paket tour terbaik kami ke destinasi paling menakjubkan di Indonesia'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-card hover-lift"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {tour.coverImg ? (
                    <Image
                      src={tour.coverImg}
                      alt={tour.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                      <span className="text-white text-4xl">🏝️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-3 left-3 bg-white/95 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {tour.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><span>🕐</span> {tour.duration}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><span>📍</span> {tour.destination}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {tour.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {tour.avgRating !== undefined && tour.avgRating > 0 ? (
                      <StarRating rating={tour.avgRating} size="sm" />
                    ) : (
                      <span className="text-sm text-gray-400">Belum ada review</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400">Mulai dari</span>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(tour.priceAdult)}</p>
                    </div>
                    <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform duration-200">
                      Lihat Detail →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {tours.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Belum ada paket tour tersedia saat ini.
            </div>
          )}

          <div className="text-center mt-10">
            <Button href={toursData.ctaLink || '/tours'} variant="primary" size="lg">
              {toursData.ctaText || 'Lihat Semua Paket Wisata'}
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      {galleryPhotos.length > 0 && (
        <section className="py-16 sm:py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-10">
            <div className="text-center">
              <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">{galleryData.label || 'Jelajah Visual'}</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {galleryData.heading || 'Sekilas Keindahan Nusantara'}
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {galleryData.subheading || 'Dari sabana luas di timur hingga pantai eksotis di barat — lihat sendiri pesona destinasi impianmu.'}
              </p>
            </div>
          </div>
          <GalleryCarousel photos={galleryPhotos} />
        </section>
      )}

      {/* Testimonial Preview */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">{testimonialsData.label || 'Testimoni'}</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {testimonialsData.heading || 'Cerita dari Mereka yang Telah Berpetualang'}
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {testimonialsData.subheading || 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-card hover-lift border border-gray-100">
                  <div className="text-4xl text-blue-200 mb-2 leading-none">&ldquo;</div>
                  <StarRating rating={review.rating} size="sm" />
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed line-clamp-4">
                    {review.reviewText}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{review.order.customerName}</p>
                    <p className="text-xs text-gray-500">{review.tour.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button href={testimonialsData.ctaLink || '/testimonials'} variant="outline">
                {testimonialsData.ctaText || 'Lihat Semua Testimoni'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Bantuan</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan-pertanyaan umum seputar pemesanan, pembayaran, dan
              perjalanan tour bersama Jelajah Nusantara.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-card group overflow-hidden border border-gray-100 hover:border-blue-100 transition-colors"
              >
                <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {faq.question}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
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
                <div className="px-5 sm:px-6 pb-5 text-gray-600 leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-4 ml-14 sm:ml-16">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700 text-white overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] blob bg-white/5 animate-float" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] blob bg-white/5 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[10%] w-[150px] h-[150px] rounded-full bg-white/5 animate-pulse-soft" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {ctaData.heading || 'Siap untuk Petualangan Berikutnya?'}
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            {ctaData.subheading || 'Pilih paket tour favorit Anda dan booking dalam hitungan menit.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href={ctaData.ctaLink || '/tours'} variant="accent" size="lg">
              {ctaData.ctaText || 'Jelajahi Paket Tour'}
            </Button>
            <Button href={ctaData.cta2Link || '/contact'} variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              {ctaData.cta2Text || 'Hubungi Kami'}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
