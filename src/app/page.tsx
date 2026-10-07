import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import {
  HAYBALI_BRAND,
  HAYBALI_TAGLINE,
  FLEET,
  AIRPORT_TRANSFER_RATES,
  waLink,
} from '@/lib/haybali';

export const dynamic = 'force-dynamic';

const HERO_STATS = [
  { num: '3', label: 'Armada Mewah' },
  { num: '10+', label: 'Paket Tour Bali' },
  { num: '24/7', label: 'Layanan Driver' },
];

const VALUE_ITEMS = [
  { icon: '🚙', title: 'Armada Prima', desc: 'Kendaraan bersih, wangi, dan terawat untuk kenyamanan perjalanan Anda.', color: 'from-amber-500 to-orange-600' },
  { icon: '👨‍✈️', title: 'Supir Profesional', desc: 'Berpengalaman, ramah, dan siap melayani dari jam 07.00 hingga tengah malam.', color: 'from-green-500 to-emerald-600' },
  { icon: '💰', title: 'Harga Transparan', desc: 'Tarif jelas tanpa biaya tersembunyi — apa yang Anda lihat, itulah yang Anda bayar.', color: 'from-purple-500 to-purple-600' },
  { icon: '⚡', title: 'Booking Instan', desc: 'Pesan online via Midtrans, invoice langsung terbit dan masuk ke email Anda.', color: 'from-blue-500 to-blue-600' },
];

const FAQ_ITEMS = [
  { question: 'Bagaimana cara melakukan booking?', answer: 'Pilih paket tour atau layanan yang Anda inginkan, tentukan tanggal dari kalender, isi data diri, lalu klik "Booking Sekarang". Invoice langsung terbit dan pembayaran diproses aman melalui Midtrans (QRIS, Virtual Account, e-wallet, atau kartu).' },
  { question: 'Apakah sewa mobil sudah termasuk supir dan BBM?', answer: 'Ya. Semua harga sewa mobil HAYBALI TRANS sudah termasuk supir berpengalaman dan BBM untuk pemakaian 12 jam. Area terpencil di luar area standar dikenakan biaya tambahan sesuai tabel yang tertera.' },
  { question: 'Bagaimana kebijakan jam kerja pengemudi?', answer: 'Jam kerja pengemudi adalah 07.00–23.59 WITA. Penjemputan 07.00–10.30 tanpa biaya tambahan; di luar jam tersebut dikenakan Rp 50.000/mobil. Lewat tengah malam dikenakan Rp 150.000/jam, dan bila menginap di luar kota dikenakan Rp 350.000/malam.' },
  { question: 'Bagaimana kebijakan pembatalan?', answer: 'Pembatalan dilakukan minimal 3 jam sebelum jam pemberangkatan dan dikenakan biaya 50% dari tiket. Mohon informasikan segera bila pesawat Anda mengalami delay agar kami dapat menyesuaikan penjemputan.' },
];

async function getBaliTours() {
  const tours = await prisma.tour.findMany({
    where: {
      isActive: true,
      // Layanan khusus (sewa mobil & antar-jemput) punya halaman sendiri
      category: { notIn: ['CAR_RENTAL', 'AIRPORT_TRANSFER'] },
    },
    orderBy: { sortOrder: 'asc' },
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
  return prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { order: { select: { customerName: true } }, tour: { select: { name: true } } },
  });
}

export default async function HomePage() {
  const [tours, reviews] = await Promise.all([getBaliTours(), getLatestReviews()]);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative text-white overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/haybali/hero-bali.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-amber-900/60" />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] blob bg-amber-400/10 animate-float" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[350px] h-[350px] blob bg-white/5 animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36">
          <div className="max-w-2xl">
            <span className="inline-block bg-amber-400/15 backdrop-blur-sm border border-amber-300/30 rounded-full px-4 py-1.5 text-sm mb-6 tracking-wide animate-fade-in">
              {HAYBALI_BRAND} • {HAYBALI_TAGLINE}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up drop-shadow-lg">
              Jelajahi Pesona Bali dengan <span className="text-amber-400">Kenyamanan VIP</span>
            </h1>
            <p className="text-base sm:text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animate-delay-200 drop-shadow">
              Layanan sewa mobil mewah, paket tur privat terbaik, dan antar-jemput bandara 24/7.
              Supir berpengalaman, kendaraan prima, dan pelayanan profesional.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <Button href="/tours" variant="accent" size="lg">
                Booking Sekarang
              </Button>
              <Button href={waLink('Halo HAYBALI TRANS, saya ingin bertanya tentang layanan Anda')} variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
                Chat WhatsApp
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-white/15 animate-fade-in-up animate-delay-400">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-400">{stat.num}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN ================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Mengapa Memilih Kami?</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Pelayanan VIP, Tanpa Repot</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Kami hadir untuk memberikan pengalaman perjalanan terbaik di Bali dengan standar pelayanan premium.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {VALUE_ITEMS.map((item) => (
              <div key={item.title} className="group bg-white rounded-xl p-3 sm:p-6 shadow-card hover-lift text-center border border-gray-100 hover:border-amber-100 transition-colors">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl sm:text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span>{item.icon}</span>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARMADA ================= */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Sewa Mobil</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Armada Mobil Utama</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Kendaraan bersih, wangi, dan terawat untuk kenyamanan perjalanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLEET.map((car) => (
              <div key={car.slug} className="group bg-white rounded-xl overflow-hidden shadow-card hover-lift">
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={car.imageUrl}
                    alt={car.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-white/95 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {car.capacityLabel}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{car.name}</h3>
                  <p className="text-xl font-bold text-amber-600 mb-3">
                    {formatCurrency(car.price)} <span className="text-sm font-normal text-gray-400">/ 12 Jam</span>
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {car.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-amber-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button href={`/tours/${car.slug}/booking`} variant="primary" size="sm" fullWidth>
                      Sewa Sekarang
                    </Button>
                    <Button href="/sewa-mobil" variant="outline" size="sm" fullWidth>
                      Detail
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PAKET TOUR ================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Paket Tour</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Paket Tour Destinasi Pilihan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Nikmati liburan seru di Bali tanpa khawatir rute perjalanan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-card hover-lift border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  {tour.coverImg ? (
                    <Image
                      src={tour.coverImg}
                      alt={tour.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                      <span className="text-white text-4xl">🏝️</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/95 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {TourCategoryLabels[tour.category as TourCategory] || tour.category}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><span>🕐</span> {tour.duration}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><span>📍</span> {tour.destination}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {tour.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {tour.avgRating > 0 ? (
                      <StarRating rating={tour.avgRating} size="sm" />
                    ) : (
                      <span className="text-sm text-gray-400">Belum ada review</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400">Mulai dari</span>
                      <p className="text-lg font-bold text-amber-600">{formatCurrency(tour.priceAdult)}</p>
                    </div>
                    <span className="inline-flex items-center text-sm font-medium text-amber-600 group-hover:translate-x-1 transition-transform duration-200">
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
            <Button href="/tours" variant="primary" size="lg">
              Lihat Semua Paket Tour
            </Button>
          </div>
        </div>
      </section>

      {/* ================= ANTAR-JEMPUT ================= */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Layanan 24/7</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Antar-Jemput Bandara Ngurah Rai</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Layanan penjemputan dan pengantaran tepat waktu. Harga per sekali antar/jemput, sesuai jumlah penumpang.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden max-w-3xl mx-auto">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-amber-500 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Area / Tujuan</th>
                    <th className="text-right px-4 py-3 font-semibold">1 - 5 Orang</th>
                    <th className="text-right px-4 py-3 font-semibold">6 - 10 Orang</th>
                  </tr>
                </thead>
                <tbody>
                  {AIRPORT_TRANSFER_RATES.map((r) => (
                    <tr key={r.area} className="border-t border-gray-100 hover:bg-amber-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700">{r.area}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(r.priceSmall)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        {r.priceBig !== null ? formatCurrency(r.priceBig) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Harga dapat berubah sewaktu-waktu. Konfirmasi harga akhir via WhatsApp.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button href="/antar-jemput" variant="primary" size="lg">
              Booking Antar-Jemput
            </Button>
            <Button href={waLink('Halo HAYBALI TRANS, saya ingin bertanya harga antar-jemput bandara')} variant="outline" size="lg">
              Tanya Harga via WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* ================= KEBIJAKAN ================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Informasi Penting</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pembayaran & Syarat Ketentuan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">💳</span>
                Pembayaran
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <li>• Booking online aman melalui Midtrans — tersedia QRIS, Virtual Account, e-wallet (GoPay, ShopeePay, DANA), dan kartu kredit/debit.</li>
                <li>• Tersedia opsi DP 30% dengan cicilan untuk paket tour tertentu.</li>
                <li>• Tanpa biaya tersembunyi — rincian biaya jelas di invoice sebelum pembayaran.</li>
                <li>• Batas pembayaran 24 jam sejak invoice terbit; pesanan melewati batas waktu otomatis dibatalkan.</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">📋</span>
                Syarat & Ketentuan
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <li>• Mohon memberikan data yang jelas untuk mempermudah penjemputan.</li>
                <li>• Pembatalan minimal 3 jam sebelum pemberangkatan, dikenakan biaya 50% dari tiket.</li>
                <li>• Informasikan bila pesawat Anda delay agar kami dapat menyesuaikan jadwal.</li>
                <li>• Jam kerja pengemudi 07.00–23.59 WITA. Penjemputan normal 07.00–10.30; di luar itu +Rp 50.000/mobil.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Testimoni</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Cerita dari Mereka yang Telah Berpetualang</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan pelayanan HAYBALI TRANS.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-6 shadow-card hover-lift border border-gray-100">
                  <div className="text-4xl text-amber-200 mb-2 leading-none">&ldquo;</div>
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
              <Button href="/testimonials" variant="outline">
                Lihat Semua Testimoni
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ================= FAQ ================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">Bantuan</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan umum seputar pemesanan, pembayaran, dan perjalanan bersama HAYBALI TRANS.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-card group overflow-hidden border border-gray-100 hover:border-amber-100 transition-colors"
              >
                <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-gray-900 hover:text-amber-600 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
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

      {/* ================= CTA KONTAK ================= */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] blob bg-white/10 animate-float" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] blob bg-white/10 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Siap Menjelajahi Bali dengan {HAYBALI_BRAND}?
          </h2>
          <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
            Hubungi kami untuk konsultasi gratis — tim kami siap membantu memilihkan layanan terbaik untuk perjalanan Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button href="/tours" variant="accent" size="lg">
              Booking Sekarang
            </Button>
            <Button href={waLink('Halo HAYBALI TRANS, saya ingin konsultasi layanan')} variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              Chat WhatsApp
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/90">
            <span>📍 Denpasar / Kuta, Bali - Indonesia</span>
            <span>📞 +62 812-3456-7890</span>
            <span>📧 info@haybalitrans.com</span>
          </div>
        </div>
      </section>
    </>
  );
}
