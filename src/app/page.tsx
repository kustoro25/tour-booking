import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate, parseJsonSafe } from '@/lib/utils';
import type { ItineraryDay } from '@/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';

export const dynamic = 'force-dynamic';

const faqs = [
  {
    question: 'Bagaimana cara melakukan booking?',
    answer:
      'Caranya sangat mudah! Cukup pilih paket tour yang Anda inginkan di halaman Paket Wisata, pilih tanggal keberangkatan dari kalender interaktif, isi data diri dan jumlah peserta, lalu klik "Booking Sekarang". Invoice akan langsung terbit dan dikirim ke email Anda.',
  },
  {
    question: 'Apakah saya bisa mengganti tanggal keberangkatan?',
    answer:
      'Ya, Anda bisa mengajukan perubahan tanggal keberangkatan maksimal H-7 sebelum keberangkatan. Silakan hubungi tim kami melalui WhatsApp atau email untuk proses perubahan. Perubahan tanggal bergantung pada ketersediaan slot di tanggal yang baru.',
  },
  {
    question: 'Bagaimana metode pembayaran yang tersedia?',
    answer:
      'Kami menerima pembayaran melalui transfer bank (BCA, Mandiri, BRI, BNI) dan e-wallet (OVO, Dana, GoPay, ShopeePay). Detail rekening dan instruksi pembayaran akan tercantum di invoice yang Anda terima setelah booking.',
  },
  {
    question: 'Berapa lama batas waktu pembayaran?',
    answer:
      'Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika pembayaran tidak dilakukan dalam batas waktu tersebut, pesanan akan otomatis dibatalkan oleh sistem dan slot akan dilepas kembali. Anda akan menerima email pengingat sebelum batas waktu berakhir.',
  },
  {
    question: 'Apakah saya akan menerima e-ticket?',
    answer:
      'Ya, setelah pembayaran Anda terkonfirmasi, sistem akan mengirimkan E-Ticket ke email Anda. E-Ticket berisi detail lengkap perjalanan Anda: nama paket, tanggal, itinerary, dan kontak guide yang akan mendampingi.',
  },
  {
    question: 'Apakah ada minimal peserta untuk setiap tour?',
    answer:
      'Ya, setiap paket tour memiliki minimal peserta yang berbeda-beda (umumnya 2 orang). Informasi ini tercantum di halaman detail masing-masing paket tour. Jika kuota minimal tidak terpenuhi, tim kami akan menghubungi Anda untuk opsi alternatif.',
  },
  {
    question: 'Bagaimana jika tour dibatalkan oleh pihak penyelenggara?',
    answer:
      'Jika tour terpaksa dibatalkan oleh kami karena force majeure atau kuota minimal tidak terpenuhi, Anda akan mendapatkan refund 100% dari jumlah yang telah dibayarkan. Tim kami akan menghubungi Anda untuk proses pengembalian dana.',
  },
  {
    question: 'Apakah bisa melakukan refund jika saya membatalkan?',
    answer:
      'Kebijakan refund kami: Pembatalan H-14 sebelum keberangkatan: refund 80%. Pembatalan H-7 sebelum keberangkatan: refund 50%. Pembatalan H-3 sebelum keberangkatan: refund 25%. Pembatalan kurang dari H-3: tidak ada refund. Silakan baca Syarat & Ketentuan untuk detail lengkap.',
  },
  {
    question: 'Apakah harga sudah termasuk tiket pesawat?',
    answer:
      'Umumnya harga paket tour tidak termasuk tiket pesawat, kecuali disebutkan secara eksplisit di deskripsi paket. Fasilitas yang termasuk dan tidak termasuk tercantum dengan jelas di halaman detail setiap paket tour.',
  },
  {
    question: 'Apakah anak-anak dikenakan biaya?',
    answer:
      'Ya, tersedia harga khusus untuk anak-anak (biasanya usia 3-10 tahun) yang lebih terjangkau. Detail harga dewasa dan anak tercantum di setiap halaman paket tour. Untuk anak di bawah 3 tahun umumnya gratis (tanpa fasilitas tambahan).',
  },
  {
    question: 'Bagaimana cara memberikan review setelah tour selesai?',
    answer:
      'Setelah tour selesai, Anda akan menerima email berisi link khusus untuk menulis review dan memberikan rating. Link ini berlaku satu kali dan hanya untuk tamu yang telah menyelesaikan tour. Review Anda sangat berarti bagi kami dan calon wisatawan lainnya!',
  },
];

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

export default async function HomePage() {
  const [tours, reviews] = await Promise.all([getFeaturedTours(), getLatestReviews()]);

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative text-white overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero.png')" }}
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
              <span>🔥 Ribuan wisatawan telah berangkat bersama kami</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up drop-shadow-lg">
              Jelajahi Destinasi <span className="text-orange-400">Impian</span> Anda Tanpa Ribet!
            </h1>
            <p className="text-base sm:text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animate-delay-200 drop-shadow">
              Paket tour terbaik dengan pelayanan premium, harga transparan, dan sistem booking instan.
              Pilih jadwalmu, amankan kursimu, dan bersiaplah untuk petualangan tak terlupakan.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <Button href="/tours" variant="accent" size="lg">
                🚀 Lihat Paket Wisata
              </Button>
              <Button href="/contact" variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
                Booking Sekarang
              </Button>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-white/15 animate-fade-in-up animate-delay-400">
              {[
                { num: '5000+', label: 'Wisatawan' },
                { num: '50+', label: 'Destinasi' },
                { num: '4.9', label: 'Rating ★' },
              ].map((stat) => (
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Kami hadir untuk memberikan pengalaman booking tour terbaik dengan standar pelayanan premium.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Apa yang Anda lihat, itulah yang Anda bayar.', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-600' },
              { icon: '⚡', title: 'Booking Instan', desc: '3 langkah, 1 menit. Invoice langsung terbit dan masuk ke email Anda.', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
              { icon: '🎯', title: 'Guide Profesional', desc: 'Tim guide kami berpengalaman dan bersertifikat resmi.', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
              { icon: '🛡️', title: 'Garansi Keberangkatan', desc: 'Jadwal pasti berangkat sesuai kuota minimum yang realistis.', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' },
            ].map((item, i) => (
              <div key={item.title} className="group bg-white rounded-xl p-6 shadow-card hover-lift text-center border border-gray-100 hover:border-blue-100 transition-colors">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span>{item.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Paket Pilihan</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Paket Wisata Unggulan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Temukan paket tour terbaik kami ke destinasi paling menakjubkan di Indonesia
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
                    <img
                      src={tour.coverImg}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
            <Button href="/tours" variant="primary" size="lg">
              Lihat Semua Paket Wisata
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonial Preview */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Testimoni</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cerita dari Mereka yang Telah Berpetualang
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka.
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
              <Button href="/testimonials" variant="outline">
                Lihat Semua Testimoni
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
            Siap untuk Petualangan Berikutnya?
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Pilih paket tour favorit Anda dan booking dalam hitungan menit. Mudah, cepat, dan transparan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/tours" variant="accent" size="lg">
              Jelajahi Paket Tour
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              Hubungi Kami
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
