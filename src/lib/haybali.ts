// ============================================================================
// HAYBALI TRANS — Data harga & kebijakan layanan sewa mobil, paket tour,
// antar-jemput bandara, dan biaya tambahan daerah terpencil di Bali.
// Digunakan oleh API booking (server) untuk menghitung total secara otoritatif
// dan oleh halaman publik/form booking untuk menampilkan rincian harga.
// ============================================================================

export const HAYBALI_BRAND = 'HAYBALI TRANS';
export const HAYBALI_TAGLINE = 'Sewa Mobil & Tour Bali';
export const WA_NUMBER = '6281234567890'; // +62 812-3456-7890

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
  paymentLabel?: string; // mis. 'Pembayaran Lunas (Transfer Bank)' / 'Cicilan 3x (DP 50%)'
  extraLines?: string[]; // rincian tambahan: durasi, jam jemput, area, penumpang, dll.
}

export function buildBookingWaMessage(data: BookingWaMessageData): string {
  const lines = [
    `Halo ${HAYBALI_BRAND}, saya baru saja melakukan booking:`,
    '',
    `• Invoice: ${data.invoiceNo}`,
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
  name: string; // 'Innova Zenix Q (LUX)'
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
    name: 'Innova Zenix Q (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: 1400000,
    price12h: 1800000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-zenix.png',
  },
  {
    slug: 'sewa-innova-zenix-v-bali',
    name: 'Innova Zenix V (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: 1300000,
    price12h: 1500000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-zenix-v.png',
  },
  {
    slug: 'sewa-innova-reborn-bali',
    name: 'Innova Reborn (CITY)',
    tier: 'CITY',
    recommendedPax: 4,
    maxPax: 7,
    capacityLabel: '4 Penumpang (Maks. 7)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 7 tanpa bagasi)',
    price6h: null,
    price12h: 1200000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/innova-reborn.png',
  },
  {
    slug: 'sewa-toyota-alphard-bali',
    name: 'Alphard Vellfire (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 5,
    capacityLabel: '4 Penumpang (Maks. 5)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 5 tanpa bagasi)',
    price6h: 1400000,
    price12h: 2300000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/alphard.png',
  },
  {
    slug: 'sewa-alphard-hev-bali',
    name: 'Alphard HEV (LUX)',
    tier: 'LUX',
    recommendedPax: 4,
    maxPax: 5,
    capacityLabel: '4 Penumpang (Maks. 5)',
    paxNote: 'Direkomendasikan untuk 4 penumpang (maksimum 5 tanpa bagasi)',
    price6h: 2600000,
    price12h: 3500000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/alphard-hev.png',
  },
  {
    slug: 'sewa-toyota-hiace-bali',
    name: 'Toyota HiAce',
    tier: 'CITY',
    recommendedPax: 10,
    maxPax: 14,
    capacityLabel: '10 Penumpang (Maks. 14)',
    paxNote: 'Direkomendasikan untuk 10 penumpang (maksimum 14 tanpa bagasi)',
    price6h: null,
    price12h: 1300000,
    overtimePct: 10,
    features: ['Pengemudi & Bahan Bakar Termasuk', 'Air Mineral'],
    imageUrl: '/images/haybali/hiace.png',
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
//    Revisi spesifikasi: tarif per destinasi — Ubud/Klungkung/Kintamani/
//    Bedugul +Rp 100.000, Singaraja/Karangasem +Rp 200.000, Negara +Rp 300.000.
// ----------------------------------------------------------------------------

export interface RemoteAreaFee {
  id: string; // key stabil untuk API booking
  region: string; // Bali Utara / Bali Tengah / Bali Tengah-Utara / Bali Barat / Bali Timur
  label: string; // nama area tujuan
  fee: number; // biaya tambahan (Rp)
}

export const REMOTE_AREA_FEES: RemoteAreaFee[] = [
  { id: 'ubud', region: 'Bali Tengah', label: 'Ubud', fee: 100000 },
  { id: 'klungkung', region: 'Bali Timur', label: 'Klungkung', fee: 100000 },
  { id: 'kintamani', region: 'Bali Tengah-Utara', label: 'Kintamani', fee: 100000 },
  { id: 'bedugul', region: 'Bali Tengah-Utara', label: 'Bedugul', fee: 100000 },
  { id: 'singaraja', region: 'Bali Utara', label: 'Singaraja', fee: 200000 },
  { id: 'karangasem', region: 'Bali Timur', label: 'Karangasem', fee: 200000 },
  { id: 'negara', region: 'Bali Barat', label: 'Negara', fee: 300000 },
];

/** Area standar (tanpa biaya tambahan) — satu wilayah per hari. */
export const STANDARD_AREAS = [
  { id: 'area-kota', label: 'AREA KOTA — Jimbaran, Nusa Dua, Kuta, Seminyak, Denpasar, Sanur' },
  { id: 'bali-selatan', label: 'BALI SELATAN — Jimbaran, Nusa Dua, Uluwatu, Pecatu, Bukit' },
  { id: 'bali-tengah', label: 'BALI TENGAH — Gianyar & sekitarnya' },
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
  remoteFee: number;
  latePickupFee: number;
  total: number;
}

/**
 * Total sewa mobil = harga armada + biaya area terpencil (bila ada)
 * + biaya jam penjemputan di luar tarif normal.
 */
export function calcCarRentalTotal(
  base: number,
  remoteAreaId: string,
  pickupTime: string
): CarRentalQuote {
  const remoteFee = getRemoteAreaFee(remoteAreaId)?.fee ?? 0;
  const latePickupFee = calcLatePickupFee(pickupTime);
  return {
    base,
    remoteFee,
    latePickupFee,
    total: base + remoteFee + latePickupFee,
  };
}
