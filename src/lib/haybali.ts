// ============================================================================
// HAYBALI TRANS — Data harga & kebijakan layanan sewa mobil, paket tour,
// antar-jemput bandara, dan biaya tambahan daerah terpencil di Bali.
// Digunakan oleh API booking (server) untuk menghitung total secara otoritatif
// dan oleh halaman publik/form booking untuk menampilkan rincian harga.
// ============================================================================

export const HAYBALI_BRAND = 'HAYBALI TRANS';
export const HAYBALI_TAGLINE = 'Sewa Mobil & Tour Bali';
export const WA_NUMBER = '6285119334511'; // +62 851-1933-4511

/** Buat link WhatsApp dengan teks prefill. Nomor bisa di-override dari pengaturan admin. */
export function waLink(text?: string, phoneNumber?: string): string {
  const base = `https://wa.me/${phoneNumber || WA_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Susun pesan WhatsApp prefill untuk konfirmasi booking pembayaran manual.
 * Dipakai halaman sukses booking (client) dan halaman invoice (server).
 */
export interface BookingWaMessageData {
  invoiceNo: string;
  customerName: string;
  serviceLabel: string;
  dateLabel: string;
  totalLabel: string;
  paymentLabel?: string; // mis. 'Pembayaran Lunas (Transfer Bank)' / 'Cicilan 2x (DP 50%)'
  extraLines?: string[]; // rincian tambahan: durasi, jam jemput, area, penumpang, dll.
  invoiceUrl?: string; // link halaman invoice — otomatis bisa diklik di WhatsApp
}

export function buildBookingWaMessage(data: BookingWaMessageData): string {
  const lines = [
    `Halo ${HAYBALI_BRAND}, saya baru saja melakukan booking:`,
    '',
    `• Invoice: ${data.invoiceNo}`,
    ...(data.invoiceUrl ? [`• Link Invoice: ${data.invoiceUrl}`] : []),
    `• Nama: ${data.customerName}`,
    `• Layanan: ${data.serviceLabel}`,
    `• Tanggal: ${data.dateLabel}`,
    `• Total: ${data.totalLabel}`,
  ];
  if (data.extraLines?.length) lines.push('', ...data.extraLines);
  if (data.paymentLabel) lines.push('', `• Metode: ${data.paymentLabel}`);
  lines.push('', 'Mohon konfirmasi booking & info pembayarannya. Terima kasih.');
  return lines.join('\n');
}

/** Link wa.me berisi pesan booking lengkap + nomor invoice (prefill). */
export function waBookingLink(data: BookingWaMessageData, phoneNumber?: string): string {
  return waLink(buildBookingWaMessage(data), phoneNumber);
}

// ----------------------------------------------------------------------------
// 1. Armada Sewa Mobil (harga per mobil per durasi, termasuk supir & BBM)
//    Revisi spesifikasi: 6 model — durasi 6 jam / 12 jam sesuai armada,
//    lembur 10% dari harga per jam, deposit 50% saat pemesanan.
// ----------------------------------------------------------------------------

export interface FleetItem {
  slug: string;
  name: string; // 'Inova Zenix Q (LUX)'
  tier: 'LUX' | 'CITY';
  recommendedPax: number;
  maxPax: number;
  capacityLabel: string; // badge singkat: '4 Penumpang (Maks. 7)'
  paxNote: string; // 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)'
  price6h: number | null; // null = armada ini hanya tersedia 12 jam
  price12h: number;
  overtimePct: number; // biaya lembur: % dari harga / jam
  features: string[];
  imageUrl: string;
}

export const FLEET: FleetItem[] = [
  {
    slug: 'sewa-innova-zenix-bali',
    name: 'INOVA ZENIX Q (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: 1400000,
    price12h: 1600000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-zenix.jpg',
  },
  {
    slug: 'sewa-innova-zenix-v-bali',
    name: 'INOVA ZENIX V (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: 1300000,
    price12h: 1500000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-zenix-v.jpg',
  },
  {
    slug: 'sewa-innova-reborn-bali',
    name: 'INOVA REBORN (CITY)',
    tier: 'CITY',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: null,
    price12h: 1200000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-reborn.jpg',
  },
  {
    slug: 'sewa-alphard-hev-bali',
    name: 'ALPHARD HYBRID NEW ( LUX )',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 5,
    capacityLabel: '4 Penumpang (Maks. 5)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 5 tanpa bagasi)',
    price6h: 2600000,
    price12h: 3500000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/alphard-hev.jpg',
  },
  {
    slug: 'sewa-alphard-vachelift-bali',
    name: 'ALPHARD FACELIFT (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 5,
    capacityLabel: '4 Penumpang (Maks. 5)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 5 tanpa bagasi)',
    price6h: 1400000,
    price12h: 2300000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/alphard-vachelift.jpg',
  },
  {
    slug: 'sewa-toyota-hiace-bali',
    name: 'HIACE PREMIO',
    tier: 'CITY',
    recommendedPax: 10,
    maxPax: 14,
    capacityLabel: '10 Penumpang (Maks. 14)',
    paxNote: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi)',
    price6h: null,
    price12h: 1700000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/hiace.jpg',
  },
  {
    slug: 'sewa-hiace-commuter-bali',
    name: 'HIACE COMMUTER',
    tier: 'CITY',
    recommendedPax: 10,
    maxPax: 14,
    capacityLabel: '10 Penumpang (Maks. 14)',
    paxNote: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi)',
    price6h: 1000000,
    price12h: 1300000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/hiace-commuter.jpg',
  },
];

/** Cari data armada berdasarkan slug produk sewa mobil. */
export function getFleetBySlug(slug: string): FleetItem | undefined {
  return FLEET.find((f) => f.slug === slug);
}

/**
 * Harga dasar sewa mobil untuk durasi tertentu.
 * Durasi 6 jam hanya berlaku bila armada menyediakan tarif 6 jam.
 */
export function getCarRentalBasePrice(slug: string, durationHours: number): number {
  const fleet = getFleetBySlug(slug);
  if (!fleet) return 0;
  if (durationHours === 6 && fleet.price6h !== null) return fleet.price6h;
  return fleet.price12h;
}

// ----------------------------------------------------------------------------
// 2. Biaya Tambahan Daerah (di luar harga sewa 12 jam yang disepakati)
//    Struktur mengikuti materi referensi: 4 kartu wilayah (Bali Utara,
//    Bali Tengah-Utara, Bali Timur, Bali Barat), tiap baris menggabungkan
//    beberapa area dengan satu tarif.
// ----------------------------------------------------------------------------

export interface RemoteAreaFee {
  id: string; // key stabil untuk API booking
  region: string; // Bali Utara / Bali Tengah-Utara / Bali Timur / Bali Barat
  label: string; // nama area tujuan
  fee: number; // biaya tambahan (Rp)
}

export const REMOTE_AREA_FEES: RemoteAreaFee[] = [
  { id: 'north-bedugul', region: 'Bali Utara', label: 'Bedugul, Jatiluwih, Batukaru, Baturiti', fee: 200000 },
  { id: 'north-munduk', region: 'Bali Utara', label: 'Munduk, Gitgit, Sekumpul, Banyumala', fee: 300000 },
  { id: 'north-lovina', region: 'Bali Utara', label: 'Lovina, Singaraja, Aling-Aling, Tejakula', fee: 350000 },
  { id: 'north-banjar', region: 'Bali Utara', label: 'Banjar, Temukus, Gerokgak', fee: 400000 },
  { id: 'midnorth-penelokan', region: 'Bali Tengah-Utara', label: 'Penelokan, Kintamani, Puhu, Bangli', fee: 150000 },
  { id: 'midnorth-besakih', region: 'Bali Tengah-Utara', label: 'Besakih, Sidemen, Selat, Tembuku', fee: 250000 },
  { id: 'east-lempuyang', region: 'Bali Timur', label: 'Lempuyang, Tirta Gangga, Candidasa', fee: 250000 },
  { id: 'east-amed', region: 'Bali Timur', label: 'Amed, Culik, Lahangan Sweet', fee: 300000 },
  { id: 'east-tulamben', region: 'Bali Timur', label: 'Tulamben, Tejakula, Tianyar, Kubu, Gretek', fee: 350000 },
  { id: 'west-gilimanuk', region: 'Bali Barat', label: 'Gilimanuk, Menjangan, Pemuteran, Banyuwedang', fee: 450000 },
];

/** Area standar (tanpa biaya tambahan) — satu wilayah per hari. */
export const STANDARD_AREAS = [
  { id: 'area-kota', label: 'AREA KOTA — Jimbaran, Nusa Dua, Kuta, Seminyak, Denpasar, Sanur' },
  { id: 'bali-selatan', label: 'BALI SELATAN — Jimbaran, Nusa Dua, Uluwatu, Pecatu, Bukit' },
  { id: 'bali-tengah', label: 'BALI TENGAH — Gianyar , Batubulan, singapadu, & sukawati area' },
] as const;

export function getRemoteAreaFee(id: string): RemoteAreaFee | undefined {
  return REMOTE_AREA_FEES.find((a) => a.id === id);
}

export function isStandardArea(id: string): boolean {
  return STANDARD_AREAS.some((a) => a.id === id);
}

// ----------------------------------------------------------------------------
// 3. Antar-Jemput Bandara Ngurah Rai (harga per sekali antar/jemput)
// ----------------------------------------------------------------------------

export interface TransferRate {
  area: string;
  priceSmall: number; // 1 - 5 orang
  priceBig: number | null; // 6 - 10 orang (null = tidak melayani tier ini)
}

export const AIRPORT_TRANSFER_RATES: TransferRate[] = [
  { area: 'Ayana Resort', priceSmall: 300000, priceBig: 500000 },
  { area: 'Amlapura (Karangasem)', priceSmall: 500000, priceBig: 700000 },
  { area: 'Amanusa / Mulia / Tanjung Benoa', priceSmall: 300000, priceBig: 500000 },
  { area: 'Batu Bulan (Terminal)', priceSmall: 300000, priceBig: 500000 },
  { area: 'Blah Batuh (Gianyar)', priceSmall: 350000, priceBig: 550000 },
  { area: 'Bangli', priceSmall: 500000, priceBig: 700000 },
  { area: 'Blahkiuh / Sangeh', priceSmall: 400000, priceBig: 600000 },
  { area: 'Bedugul', priceSmall: 450000, priceBig: 650000 },
  { area: 'Canggu', priceSmall: 350000, priceBig: 550000 },
  { area: 'Celukan Bawang', priceSmall: 600000, priceBig: 800000 },
  { area: 'Candi Dasa', priceSmall: 450000, priceBig: 650000 },
  { area: 'Denpasar Area', priceSmall: 150000, priceBig: 300000 },
  { area: 'Gilimanuk', priceSmall: 500000, priceBig: 800000 },
  { area: 'Gianyar', priceSmall: 350000, priceBig: 550000 },
  { area: 'Juanda - Surabaya (Jatim)', priceSmall: 3300000, priceBig: null },
  { area: 'Kedonganan / Jimbaran', priceSmall: 300000, priceBig: 500000 },
  { area: 'Kerobokan', priceSmall: 250000, priceBig: 350000 },
  { area: 'Kuta', priceSmall: 200000, priceBig: 300000 },
  { area: 'Kediri / Mengwi / Tabanan Kota', priceSmall: 350000, priceBig: 450000 },
  { area: 'Kapal / Sibang / Darmasaba', priceSmall: 350000, priceBig: 450000 },
  { area: 'Kintamani', priceSmall: 600000, priceBig: 800000 },
  { area: 'Klungkung', priceSmall: 600000, priceBig: 800000 },
  { area: 'Legian', priceSmall: 200000, priceBig: 300000 },
  { area: 'Lovina / Singaraja Kota', priceSmall: 500000, priceBig: 700000 },
  { area: 'Mengwi / Taman Ayun', priceSmall: 350000, priceBig: 500000 },
  { area: 'Mambal', priceSmall: 350000, priceBig: 500000 },
  { area: 'Medewi', priceSmall: 500000, priceBig: 700000 },
  { area: 'Malang (Jatim)', priceSmall: 3300000, priceBig: null },
  { area: 'Nusa Dua', priceSmall: 300000, priceBig: 500000 },
  { area: 'Negara', priceSmall: 500000, priceBig: 700000 },
  { area: 'Pecatu / Uluwatu', priceSmall: 350000, priceBig: 550000 },
  { area: 'Pemuteran / Matahari Resort', priceSmall: 550000, priceBig: 750000 },
  { area: 'Payangan', priceSmall: 450000, priceBig: 650000 },
  { area: 'Padang Bay', priceSmall: 500000, priceBig: 750000 },
  { area: 'Seminyak', priceSmall: 200000, priceBig: 350000 },
  { area: 'Sanur', priceSmall: 250000, priceBig: 450000 },
  { area: 'Singaraja Kota', priceSmall: 550000, priceBig: 750000 },
  { area: 'Sempidi (Kapal)', priceSmall: 300000, priceBig: 500000 },
  { area: 'Sukawati', priceSmall: 350000, priceBig: 550000 },
  { area: 'Tohpati', priceSmall: 250000, priceBig: 450000 },
  { area: 'Tulamben / Amed / Alamanda', priceSmall: 550000, priceBig: 750000 },
  { area: 'Tabanan Kota', priceSmall: 350000, priceBig: 450000 },
  { area: 'Tanah Lot', priceSmall: 450000, priceBig: 650000 },
  { area: 'Tegalalang', priceSmall: 450000, priceBig: 650000 },
  { area: 'Ungasan / Uluwatu', priceSmall: 350000, priceBig: 550000 },
  { area: 'Umalas / Kerobokan', priceSmall: 250000, priceBig: 350000 },
  { area: 'Ubud Center', priceSmall: 400000, priceBig: 600000 },
];

export const TRANSFER_MAX_PAX = 10;

export function getTransferRate(area: string): TransferRate | undefined {
  return AIRPORT_TRANSFER_RATES.find((r) => r.area === area);
}

/** Harga antar-jemput untuk jumlah penumpang tertentu. Null = tier tidak dilayani. */
export function getTransferPrice(area: string, pax: number): number | null {
  const rate = getTransferRate(area);
  if (!rate) return null;
  if (pax >= 1 && pax <= 5) return rate.priceSmall;
  if (pax >= 6 && pax <= TRANSFER_MAX_PAX) return rate.priceBig;
  return null;
}

// ----------------------------------------------------------------------------
// 4. Zona Penjemputan / Pengantaran
// ----------------------------------------------------------------------------

export const PICKUP_ZONES = [
  'Bandara Ngurah Rai',
  'Kuta',
  'Seminyak',
  'Jimbaran Utara',
  'Nusa Dua',
  'Denpasar',
  'Sanur',
  'Pusat Ubud',
] as const;

// ----------------------------------------------------------------------------
// 5. Kebijakan Jam Kerja Pengemudi
// ----------------------------------------------------------------------------

export const DRIVER_POLICY = {
  workStart: '07:00',
  workEnd: '23:59', // maksimum
  normalPickupStart: '07:00',
  normalPickupEnd: '10:30', // tarif normal jika dijemput 07.00–10.30
  latePickupFee: 50000, // di luar jam tarif normal: +Rp 50.000 / mobil
  midnightHourlyFee: 150000, // lewat 23.59 (tengah malam): +Rp 150.000 / jam
  driverAccommodation: 350000, // minimal Rp 350.000 / malam jika menginap di luar kota
} as const;

/** Opsi jam penjemputan (setiap 30 menit, 07:00–23:30). */
export function getPickupTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 7; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) break; // maksimal 23:30
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
}

/** Biaya tambahan jam penjemputan di luar tarif normal (07.00–10.30). */
export function calcLatePickupFee(pickupTime: string): number {
  if (!pickupTime) return 0;
  return pickupTime > DRIVER_POLICY.normalPickupEnd ? DRIVER_POLICY.latePickupFee : 0;
}

// ----------------------------------------------------------------------------
// 6. Helper Perhitungan Total
// ----------------------------------------------------------------------------

export interface CarRentalQuote {
  base: number;
  latePickupFee: number;
  total: number;
}

/**
 * Total sewa mobil = harga armada + biaya jam penjemputan di luar tarif normal.
 * Biaya area tujuan (REMOTE_AREA_FEES) hanya informasi — tidak dihitung otomatis,
 * nominalnya dikonfirmasi admin karena area diisi manual oleh tamu.
 */
export function calcCarRentalTotal(base: number, pickupTime: string): CarRentalQuote {
  const latePickupFee = calcLatePickupFee(pickupTime);
  return {
    base,
    latePickupFee,
    total: base + latePickupFee,
  };
}
