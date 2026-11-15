import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  DRIVER_POLICY,
  FLEET,
  HAYBALI_BRAND,
  PICKUP_ZONES,
  REMOTE_AREA_FEES,
  STANDARD_AREAS,
  getFleetBySlug,
  waLink,
} from '@/lib/haybali';
import { getFleetDetail } from '@/lib/fleet-detail';
import { getPaymentGateway, getSetting, getWhatsAppNumber } from '@/lib/settings';

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
    return { title: `Armada tidak ditemukan - ${HAYBALI_BRAND}` };
  }

  const description =
    `${detail.tagline} Sewa ${detail.fullName} di Bali mulai ` +
    `${formatCurrency(fleet.price12h)} per 12 jam, sudah termasuk supir dan BBM. ` +
    `${fleet.capacityLabel}.`;

  return {
    title: `Sewa ${detail.fullName} Bali + Supir | ${HAYBALI_BRAND}`,
    description,
    alternates: { canonical: `/sewa-mobil/${fleet.slug}` },
    openGraph: {
      title: `Sewa ${detail.fullName} Bali + Supir | ${HAYBALI_BRAND}`,
      description,
      images: [{ url: fleet.imageUrl, alt: detail.fullName }],
    },
  };
}

const REGION_COLORS: Record<string, string> = {
  'Bali Utara': 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
  'Bali Tengah-Utara': 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  'Bali Timur': 'bg-gold-400/15 text-gold-200 border border-gold-500/30',
  'Bali Barat': 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
};

export default async function FleetDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const fleet = getFleetBySlug(slug);
  const detail = getFleetDetail(slug);

  if (!fleet || !detail) notFound();

  const [waNumber, gateway, bankAccounts] = await Promise.all([
    getWhatsAppNumber(),
    getPaymentGateway(),
    getSetting<{ bank: string; number: string; name: string }[]>('bank_accounts', []),
  ]);
  const bankLabel = bankAccounts
    .map((account) => account.bank)
    .filter(Boolean)
    .join(' / ');
  const bookingHref = `/sewa-mobil/${fleet.slug}/booking`;
  const otherFleet = FLEET.filter((f) => f.slug !== fleet.slug).slice(0, 3);

  const regionGroups = REMOTE_AREA_FEES.reduce<Record<string, typeof REMOTE_AREA_FEES>>((acc, area) => {
    acc[area.region] = acc[area.region] ? [...acc[area.region], area] : [area];
    return acc;
  }, {});

  const specs = [
    { label: 'Merek', value: detail.brand },
    { label: 'Model / Tipe', value: detail.model },
    { label: 'Tipe Bodi', value: detail.bodyType },
    { label: 'Tahun', value: detail.year },
    { label: 'Konfigurasi Jok', value: detail.seatConfig },
    { label: 'Bahan Bakar', value: detail.fuel },
    { label: 'Transmisi', value: detail.transmission },
    { label: 'Warna Unit', value: detail.color },
    { label: 'Kapasitas Bagasi', value: detail.luggage },
  ];

  return (
    <div className="bg-ink-900">
      {/* ================= HERO ================= */}
      <section className="bg-ink-950 border-b border-ink-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-mist-dim mb-6 flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-gold-300 transition-colors">Beranda</Link>
            <span>/</span>
            <Link href="/sewa-mobil" className="hover:text-gold-300 transition-colors">Sewa Mobil</Link>
            <span>/</span>
            <span className="text-mist">{detail.fullName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Foto utama */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-ink-700 shadow-card bg-ink-900">
              <Image
                src={fleet.imageUrl}
                alt={`${detail.fullName} - sewa mobil dengan supir di Bali`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <span className="absolute top-3 left-3 bg-ink-900/95 text-ivory text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                {fleet.capacityLabel}
              </span>
              <span className="absolute top-3 right-3 bg-gold-400 text-ink-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {fleet.tier === 'LUX' ? 'LUXURY CLASS' : 'CITY CLASS'}
              </span>
            </div>

            {/* Ringkasan + harga */}
            <div>
              <span className="inline-block bg-gold-400/10 text-gold-300 border border-gold-500/30 rounded-full px-4 py-1.5 text-xs sm:text-sm mb-4 tracking-wide">
                {detail.brand} • {detail.model}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 text-ivory">
                Sewa {detail.fullName} <span className="text-gold-400">di Bali</span>
              </h1>
              <p className="text-mist leading-relaxed mb-6">{detail.tagline}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
                  <p className="text-xs text-mist-dim mb-1">Durasi</p>
                  <p className="text-sm font-semibold text-ivory">
                    {fleet.price6h !== null ? '6 atau 12 jam' : '12 jam'}
                  </p>
                </div>
                <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
                  <p className="text-xs text-mist-dim mb-1">Kapasitas</p>
                  <p className="text-sm font-semibold text-ivory">{fleet.recommendedPax} orang (maks. {fleet.maxPax})</p>
                </div>
              </div>

              <div className="bg-ink-900 border border-ink-700 rounded-2xl p-5 mb-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    {fleet.price6h !== null && (
                      <p className="text-sm text-mist-dim mb-1">
                        {formatCurrency(fleet.price6h)} <span className="text-xs">/ 6 Jam</span>
                      </p>
                    )}
                    <p className="text-3xl font-bold text-gold-300">
                      {formatCurrency(fleet.price12h)}
                      <span className="text-sm font-medium text-mist-dim"> / 12 Jam</span>
                    </p>
                    <p className="text-xs text-mist-dim mt-1">
                      Harga per mobil — sudah termasuk supir &amp; BBM
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-gold-400/15 text-gold-300 px-3 py-1.5 rounded-full">
                    Lembur {fleet.overtimePct}% / jam
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button href={bookingHref} variant="accent" size="lg" className="flex-1">
                  Pesan Mobil Ini
                </Button>
                <Button
                  href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya tentang sewa ${detail.fullName}.`, waNumber)}
                  variant="outline"
                  size="lg"
                  className="flex-1 !border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10"
                  target="_blank"
                >
                  Chat WhatsApp
                </Button>
              </div>
              <p className="text-xs text-mist-dim mt-3">
                Pemesanan memerlukan deposit 50% untuk mengamankan jadwal &amp; pengemudi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= IKHTISAR & KEUNGGULAN ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ivory mb-4">Gambaran Umum {detail.model}</h2>
            <div className="space-y-4 text-mist leading-relaxed">
              {detail.overview.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ivory mb-4">Keunggulan Armada Ini</h2>
            <ul className="space-y-3">
              {detail.highlights.map((item) => (
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
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Spesifikasi</span>
            <h2 className="text-3xl font-bold text-ivory">Detail Kendaraan &amp; Fasilitas</h2>
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
              <h3 className="text-lg font-bold text-ivory mb-4">Fasilitas Kabin</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {detail.interiorFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-mist leading-relaxed">
                    <span className="text-gold-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-ink-700 text-sm text-mist-dim leading-relaxed">
                Unit yang dikirim menyesuaikan ketersediaan warna pada tanggal pemesanan. Bila Anda
                memerlukan warna atau konfigurasi tertentu, konfirmasikan lewat WhatsApp sebelum booking.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TARIF & KETENTUAN ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="text-center mb-10">
          <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Tarif &amp; Ketentuan</span>
          <h2 className="text-3xl font-bold text-ivory">Cara Perhitungan Harga Sewa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">Pilihan Durasi</h3>
            <ul className="space-y-2 text-sm text-mist">
              {fleet.price6h !== null && (
                <li className="flex justify-between gap-3">
                  <span>Paket 6 jam</span>
                  <span className="font-semibold text-gold-300 whitespace-nowrap">{formatCurrency(fleet.price6h)}</span>
                </li>
              )}
              <li className="flex justify-between gap-3">
                <span>Paket 12 jam</span>
                <span className="font-semibold text-gold-300 whitespace-nowrap">{formatCurrency(fleet.price12h)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Lembur</span>
                <span className="font-semibold text-ivory whitespace-nowrap">{fleet.overtimePct}% / jam</span>
              </li>
            </ul>
            <p className="text-xs text-mist-dim mt-4">
              Harga dihitung <strong>per mobil</strong>, bukan per orang, dan sudah termasuk supir serta BBM.
            </p>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">Pembayaran</h3>
            <ul className="space-y-2 text-sm text-mist leading-relaxed">
              <li>• Deposit 50% saat booking untuk mengunci jadwal &amp; pengemudi.</li>
              <li>• Pelunasan sisa pembayaran tunai saat bertemu driver.</li>
              {gateway === 'midtrans' ? (
                <li>
                  • Pembayaran online via QRIS, Virtual Account, e-wallet, atau kartu kredit/debit —
                  status terkonfirmasi otomatis.
                </li>
              ) : (
                <>
                  <li>
                    • Transfer bank{bankLabel ? ` (${bankLabel})` : ''} ke rekening perusahaan — detail
                    rekening tercantum di invoice.
                  </li>
                  <li>
                    • Kirim bukti transfer via WhatsApp atau email, status pembayaran diaktifkan
                    manual oleh admin.
                  </li>
                </>
              )}
              <li>• Tersedia opsi cicilan 2x untuk layanan tertentu.</li>
              <li>• Batas pembayaran 24 jam sejak invoice terbit.</li>
            </ul>
          </div>

          <div className="bg-ink-850 rounded-2xl border border-ink-700 shadow-card p-6">
            <h3 className="font-bold text-ivory mb-3">Jam Kerja Pengemudi</h3>
            <ul className="space-y-2 text-sm text-mist leading-relaxed">
              <li>• Jam kerja {DRIVER_POLICY.workStart}–{DRIVER_POLICY.workEnd} WITA.</li>
              <li>
                • Penjemputan normal {DRIVER_POLICY.normalPickupStart}–{DRIVER_POLICY.normalPickupEnd}; di luar jam
                tersebut +{formatCurrency(DRIVER_POLICY.latePickupFee)}/mobil.
              </li>
              <li>• Lewat tengah malam +{formatCurrency(DRIVER_POLICY.midnightHourlyFee)}/jam.</li>
              <li>• Menginap di luar kota mulai {formatCurrency(DRIVER_POLICY.driverAccommodation)}/malam.</li>
              <li>• Bila pembatalan dilakukan kurang dari 3 jam sebelum pemberangkatan, mohon dimaklumi bahwa DP yang telah dibayarkan tidak dapat dikembalikan karena jadwal &amp; pengemudi telah kami kunci untuk Anda.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= TERMASUK / TIDAK TERMASUK ================= */}
      <section className="bg-ink-950 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Rincian Harga</span>
            <h2 className="text-3xl font-bold text-ivory">Sudah Termasuk &amp; Belum Termasuk</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6">
              <h3 className="font-semibold text-green-200 mb-4">Sudah termasuk dalam harga</h3>
              <ul className="space-y-2 text-sm text-green-100">
                {detail.included.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5">✓</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6">
              <h3 className="font-semibold text-rose-200 mb-4">Belum termasuk</h3>
              <ul className="space-y-2 text-sm text-rose-100">
                {detail.excluded.map((item) => (
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
          <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Area Layanan</span>
          <h2 className="text-3xl font-bold text-ivory">Penjemputan Gratis &amp; Biaya Area Terpencil</h2>
          <p className="text-mist-dim max-w-2xl mx-auto mt-3">
            Harga standar berlaku untuk area umum di Bali Selatan dan Bali Tengah, dan hanya memungkinkan
            menjelajahi <strong>satu wilayah dalam satu hari</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6">
            <h3 className="font-semibold text-green-200 mb-3">Area standar (tanpa biaya tambahan)</h3>
            <ul className="space-y-1.5 text-sm text-green-200">
              {STANDARD_AREAS.map((area) => (
                <li key={area.id} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> <span>{area.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-ink-850 border border-ink-700 rounded-2xl p-6">
            <h3 className="font-semibold text-ivory mb-3">Zona penjemputan gratis</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-mist">
              {PICKUP_ZONES.map((zone) => (
                <li key={zone} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span> <span>{zone}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mist-dim mt-4">
              Di luar zona di atas, silakan hubungi kami untuk ketersediaan dan harga.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(regionGroups).map(([region, areas]) => (
            <div key={region} className="bg-ink-850 border border-ink-700 rounded-2xl p-5">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${REGION_COLORS[region] || 'bg-ink-700 text-mist'}`}>
                {region}
              </span>
              <ul className="space-y-3">
                {areas.map((area) => (
                  <li key={area.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-mist">{area.label}</span>
                    <span className="font-bold text-gold-300 whitespace-nowrap">+{formatCurrency(area.fee)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ARMADA LAIN ================= */}
      <section className="bg-ink-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Pilihan Lain</span>
            <h2 className="text-3xl font-bold text-ivory">Armada Lainnya</h2>
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
                    {car.capacityLabel}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-ivory mb-1">{car.name}</h3>
                  <p className="text-gold-300 font-bold mb-3">
                    {formatCurrency(car.price12h)}
                    <span className="text-xs font-medium text-mist-dim"> / 12 Jam</span>
                  </p>
                  <span className="mt-auto text-sm font-semibold text-gold-300 group-hover:text-gold-200">
                    Lihat detail →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button href="/sewa-mobil" variant="outline" size="md">
              Lihat Semua Armada
            </Button>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative py-16 bg-ink-900 border-y border-gold-500/25 text-ivory overflow-hidden">
        <div className="absolute inset-0 gold-panel" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Siap jalan dengan {detail.fullName}?</h2>
          <p className="text-mist mb-8">
            Pilih tanggal dan durasi, invoice langsung terbit. Butuh rute khusus? Tim kami siap membantu via WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href={bookingHref} variant="accent" size="lg">
              Pesan Mobil Ini
            </Button>
            <Button
              href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin konsultasi sewa ${detail.fullName}.`, waNumber)}
              variant="outline"
              size="lg"
              className="!border-gold-400/60 !text-gold-200 hover:!bg-gold-400/10"
              target="_blank"
            >
              Chat WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
