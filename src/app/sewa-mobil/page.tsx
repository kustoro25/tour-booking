import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import {
  HAYBALI_BRAND,
  HAYBALI_TAGLINE,
  FLEET,
  REMOTE_AREA_FEES,
  STANDARD_AREAS,
  PICKUP_ZONES,
  DRIVER_POLICY,
  waLink,
} from '@/lib/haybali';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${HAYBALI_BRAND} - Sewa Mobil & Tour Bali`,
  description:
    'Sewa mobil mewah & paket tur privat di Bali. Supir berpengalaman, kendaraan prima, antar-jemput bandara 24/7.',
};

async function getFleetTours() {
  const tours = await prisma.tour.findMany({
    where: { isActive: true, category: 'CAR_RENTAL' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, priceAdult: true, coverImg: true },
  });
  return tours;
}

const REGION_COLORS: Record<string, string> = {
  'Bali Utara': 'bg-blue-100 text-blue-700',
  'Bali Tengah-Utara': 'bg-teal-100 text-teal-700',
  'Bali Barat': 'bg-orange-100 text-orange-700',
  'Bali Timur': 'bg-purple-100 text-purple-700',
};

export default async function SewaMobilPage() {
  const fleetTours = await getFleetTours();
  const regionGroups = REMOTE_AREA_FEES.reduce<Record<string, typeof REMOTE_AREA_FEES>>((acc, area) => {
    (acc[area.region] ||= []).push(area);
    return acc;
  }, {});

  return (
    <div className="bg-gray-50">
      {/* Hero HAYBALI TRANS */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24">
          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-4 py-1.5 text-sm mb-4 tracking-wide">
            {HAYBALI_BRAND} • {HAYBALI_TAGLINE}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-2xl text-gray-900">
            Jelajahi Pesona Bali dengan{' '}
            <span className="text-amber-500">Kenyamanan VIP</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
            Layanan sewa mobil mewah & paket tur privat terbaik di Bali. Supir
            berpengalaman, kendaraan prima, dan pelayanan profesional.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="#armada" variant="accent" size="lg">
              Lihat Armada
            </Button>
            <Button
              href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya harga sewa mobil.`)}
              variant="outline"
              size="lg"
              className="!border-gray-300 !text-gray-700 hover:!bg-gray-50"
              target="_blank"
            >
              Chat WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Armada */}
      <section id="armada" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Armada Mobil Utama</span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Kendaraan bersih, wangi, dan terawat</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Semua harga sudah termasuk supir & BBM untuk pemakaian 12 jam di area standar (Area Kota, Bali Selatan, Bali Tengah).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {fleetTours.map((tour) => {
            const fleet = FLEET.find((f) => f.slug === tour.slug);
            const image = tour.coverImg || fleet?.imageUrl;
            return (
              <div key={tour.id} className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col">
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
                  <span className="absolute top-3 left-3 bg-white/95 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {fleet?.capacityLabel}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{tour.name}</h3>
                  <p className="text-blue-600 font-bold text-2xl mb-4">
                    {formatCurrency(tour.priceAdult)}
                    <span className="text-gray-400 text-sm font-medium"> / 12 Jam</span>
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600 mb-6 flex-1">
                    {(fleet?.features || []).map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                  <Button href={`/tours/${tour.slug}/booking`} variant="primary" fullWidth>
                    Pesan {tour.name.replace('Sewa ', '').replace(' Bali', '')}
                  </Button>
                </div>
              </div>
            );
          })}
          {fleetTours.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Armada belum tersedia saat ini. Silakan hubungi kami via WhatsApp.
            </div>
          )}
        </div>
      </section>

      {/* Kebijakan Daerah Terpencil */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-orange-500 text-sm font-semibold tracking-wide uppercase mb-2">Kebijakan Daerah Terpencil</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Biaya Tambahan di Luar Area Standar</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Harga standar berlaku untuk area umum dan hanya memungkinkan menjelajahi{' '}
              <strong>satu wilayah dalam satu hari</strong>. Anda juga dapat bepergian ke luar
              area ini dengan biaya tambahan (di luar harga yang telah disepakati untuk 10 jam) sebagai berikut:
            </p>
          </div>

          {/* Area standar */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-8">
            <h3 className="font-semibold text-green-800 mb-3">✅ Area Standar (Tanpa Biaya Tambahan)</h3>
            <ul className="space-y-1.5 text-sm text-green-800">
              {STANDARD_AREAS.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> {a.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Grup area terpencil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(regionGroups).map(([region, areas]) => (
              <div key={region} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${REGION_COLORS[region] || 'bg-gray-200 text-gray-700'}`}>
                  {region}
                </span>
                <ul className="space-y-3">
                  {areas.map((area) => (
                    <li key={area.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-700">{area.label}</span>
                      <span className="font-bold text-orange-600 whitespace-nowrap">+{formatCurrency(area.fee)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-6 italic text-center">
            “Mohon beri tahu kami jika Anda perlu mengklarifikasi apakah rencana perjalanan Anda
            memenuhi syarat untuk harga normal atau harga untuk lokasi terpencil.”
          </p>
        </div>
      </section>

      {/* Zona Jemput & Jam Kerja */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span> Zona Penjemputan / Pengantaran
            </h3>
            <ul className="space-y-2 text-gray-600">
              {PICKUP_ZONES.map((zone) => (
                <li key={zone} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span> {zone}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-4">
              Silakan hubungi kami untuk informasi harga dan ketersediaan di area lain. Jika Anda
              menginap di tempat yang berbeda, mohon jelaskan dalam pertanyaan Anda.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⏰</span> Jam Kerja Pengemudi
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Pukul <strong>{DRIVER_POLICY.workStart}</strong> hingga{' '}
                <strong>{DRIVER_POLICY.workEnd}</strong> (maksimum).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Tarif berlaku jika Anda dijemput selama jam kerja kami ({DRIVER_POLICY.normalPickupStart} hingga{' '}
                {DRIVER_POLICY.normalPickupEnd}). Di luar jam kerja tersebut, dikenakan biaya tambahan sebesar{' '}
                <strong>{formatCurrency(DRIVER_POLICY.latePickupFee)}</strong> / mobil, tanpa memandang modelnya.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Biaya tambahan jam kerja setelah pukul {DRIVER_POLICY.workEnd} (tengah malam) adalah{' '}
                <strong>{formatCurrency(DRIVER_POLICY.midnightHourlyFee)}</strong> / jam.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Biaya akomodasi pengemudi minimal <strong>{formatCurrency(DRIVER_POLICY.driverAccommodation)}</strong> /
                malam (tergantung musim) jika Anda menginap di luar kota/daerah terpencil.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pembayaran & Syarat */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">💳 Pembayaran</h3>
            <ul className="space-y-2 text-sm text-blue-900/80">
              <li>• Pembayaran dapat dilakukan secara online saat booking (QRIS, Virtual Account, e-wallet, kartu) atau di tempat penjemputan.</li>
              <li>• Dalam setiap pemesanan tidak dikenakan biaya deposit, kecuali bila diperlukan — kami pasti akan memberikan informasi terlebih dahulu, terutama pada saat high dan peak season.</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-3">📄 Syarat & Ketentuan</h3>
            <ul className="space-y-2 text-sm text-amber-900/80">
              <li>• Mohon memberikan data yang konkret (jelas) untuk mempermudah penjemputan.</li>
              <li>• Pembatalan tiket harus dilakukan 3 jam sebelum jam pemberangkatan dan akan dikenakan biaya 50% dari tiket.</li>
              <li>• Silakan informasikan bila pesawat mengalami delay agar semua proses berjalan lancar.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Punya Pertanyaan atau Permintaan Khusus?</h2>
          <p className="text-white/80 mb-8">
            Anda dipersilakan menghubungi kami untuk permintaan khusus atau klarifikasi area perjalanan Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya tentang sewa mobil & tour Bali.`)}
              variant="accent"
              size="lg"
              target="_blank"
            >
              💬 Chat WhatsApp {HAYBALI_BRAND}
            </Button>
            <Button href="/antar-jemput" variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              Lihat Tarif Antar-Jemput
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-8">
            {HAYBALI_BRAND} • Denpasar / Kuta, Bali • +62 812-3456-7890 • Layanan Driver & WhatsApp: 24/7 Online
          </p>
        </div>
      </section>
    </div>
  );
}
