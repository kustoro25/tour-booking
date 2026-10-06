// ============================================================================
// HAYBALI TRANS — Data harga & kebijakan layanan sewa mobil, paket tour,
// antar-jemput bandara, dan biaya tambahan daerah terpencil di Bali.
// Digunakan oleh API booking (server) untuk menghitung total secara otoritatif
// dan oleh halaman publik/form booking untuk menampilkan rincian harga.
// ============================================================================

export const HAYBALI_BRAND = 'HAYBALI TRANS';
export const HAYBALI_TAGLINE = 'Sewa Mobil & Tour Bali';
export const WA_NUMBER = '6281234567890'; // +62 812-3456-7890

/** Buat link WhatsApp dengan teks prefill. */
export function waLink(text?: string): string {
  const base = `https://wa.me/${WA_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// ----------------------------------------------------------------------------
// 1. Armada Sewa Mobil (harga per mobil / 12 jam, termasuk supir & BBM)
// ----------------------------------------------------------------------------

export interface FleetItem {
  slug: string;
  name: string;
  capacityLabel: string; // '6 - 7 Penumpang'
  minPax: number;
  maxPax: number;
  price: number; // per mobil / 12 jam
  features: string[];
  imageUrl: string;
}

export const FLEET: FleetItem[] = [
  {
    slug: 'sewa-toyota-alphard-bali',
    name: 'Toyota Alphard',
    capacityLabel: '6 - 7 Penumpang',
    minPax: 6,
    maxPax: 7,
    price: 1800000,
    features: ['Termasuk Supir & BBM', 'Interior Luxury & Air Mineral'],
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  },
  {
    slug: 'sewa-innova-zenix-bali',
    name: 'Innova Zenix',
    capacityLabel: '5 - 6 Penumpang',
    minPax: 5,
    maxPax: 6,
    price: 850000,
    features: ['Termasuk Supir & BBM', 'Kabin Modern & Nyaman'],
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
  },
  {
    slug: 'sewa-toyota-hiace-bali',
    name: 'Toyota HiAce',
    capacityLabel: '12 - 15 Penumpang',
    minPax: 12,
    maxPax: 15,
    price: 1100000,
    features: ['Termasuk Supir & BBM', 'Cocok untuk Rombongan / Event'],
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  },
];

// ----------------------------------------------------------------------------
// 2. Biaya Tambahan Daerah Terpencil (di luar harga sewa 10 jam yang disepakati)
// ----------------------------------------------------------------------------

export interface RemoteAreaFee {
  id: string; // key stabil untuk API booking
  region: string; // Bali Utara / Bali Tengah-Utara / Bali Barat / Bali Timur
  label: string; // nama area tujuan
  fee: number; // biaya tambahan (Rp)
}

export const REMOTE_AREA_FEES: RemoteAreaFee[] = [
  { id: 'tanah-lot-taman-ayun-bedugul-baturiti', region: 'Bali Utara', label: 'Tanah Lot, Taman Ayun, Bedugul, Baturiti', fee: 100000 },
  { id: 'munduk-banyumala-tamblingan-buyan', region: 'Bali Utara', label: 'Munduk, Air Terjun Banyumala, Danau Kembar Tamblingan & Buyan', fee: 150000 },
  { id: 'lovina-singaraja-gitgit-sekumpul-aling-aling', region: 'Bali Utara', label: 'Lovina, Singaraja, Gitgit, Sekumpul, Aling-Aling', fee: 250000 },
  { id: 'banjar-temoekoes-gerogak', region: 'Bali Utara', label: 'Banjar, Temoekoes, Gerogak', fee: 350000 },
  { id: 'kintamani-penelokan-puhu-bangli', region: 'Bali Tengah-Utara', label: 'Pemandangan Penelokan Dataran Tinggi Kintamani, Puhu, Bangli', fee: 100000 },
  { id: 'songan', region: 'Bali Tengah-Utara', label: 'Area Songan', fee: 250000 },
  { id: 'besakih-tembuku-tukad-cepung', region: 'Bali Tengah-Utara', label: 'Besakih, Tembuku, Tukad Cepung', fee: 150000 },
  { id: 'batukaru', region: 'Bali Barat', label: 'Batukaru', fee: 250000 },
  { id: 'jatiluwih', region: 'Bali Barat', label: 'Jatiluwih', fee: 150000 },
  { id: 'silemadeg-belimbing-pudjungan-medewi', region: 'Bali Barat', label: 'Silemadeg, Belimbing, Pudjungan, Medewi', fee: 300000 },
  { id: 'gilimanuk-menjangan-pemuteran-banyuwedang', region: 'Bali Barat', label: 'Gilimanuk, Menjangan, Pemuteran, Banyuwedang', fee: 450000 },
  { id: 'padang-bai-selat-sidemen', region: 'Bali Timur', label: 'Padang Bai, Selat, Sidemen', fee: 150000 },
  { id: 'candidasa', region: 'Bali Timur', label: 'Candidasa', fee: 250000 },
  { id: 'amed-lempuyang-tirta-gangga-chulik-lahangan-sweet', region: 'Bali Timur', label: 'Amed, Lempuyang, Tirta Gangga, Chulik, Lahangan Sweet', fee: 300000 },
  { id: 'tulamben-tejakula-tianyar-kubu-gretek', region: 'Bali Timur', label: 'Tulamben, Tejakula, Tianyar, Kubu, Gretek', fee: 400000 },
];

/** Area standar (tanpa biaya tambahan) — satu wilayah per hari. */
export const STANDARD_AREAS = [
  { id: 'area-kota', label: 'AREA KOTA — Jimbaran, Nusa Dua, Kuta, Seminyak, Denpasar, Sanur' },
  { id: 'bali-selatan', label: 'BALI SELATAN — Jimbaran, Nusa Dua, Uluwatu, Pecatu, Bukit' },
  { id: 'bali-tengah', label: 'BALI TENGAH — Wilayah Ubud' },
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
