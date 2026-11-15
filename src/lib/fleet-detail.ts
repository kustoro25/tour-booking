// ============================================================================
// HAYBALI TRANS — Konten halaman detail per armada sewa mobil.
// Harga, kapasitas, dan kebijakan tetap bersumber dari `haybali.ts`
// (sumber otoritatif untuk perhitungan); file ini hanya menambah konten
// deskriptif khas tiap tipe kendaraan untuk halaman /sewa-mobil/[slug].
// ============================================================================

export interface FleetDetail {
  slug: string;
  brand: string; // 'Toyota'
  model: string; // 'Alphard Hybrid New'
  fullName: string; // 'Toyota Alphard Hybrid New'
  bodyType: string; // 'MPV Luxury'
  year: string; // '2024'
  color: string;
  fuel: string;
  transmission: string;
  luggage: string;
  seatConfig: string;
  tagline: string;
  overview: string[];
  highlights: string[];
  interiorFeatures: string[];
  included: string[];
  excluded: string[];
  gallery: string[]; // foto pertama dipakai sebagai hero
}

/** Fasilitas yang berlaku untuk seluruh armada. */
const INCLUDED_COMMON = [
  'Supir profesional berbahasa Indonesia & Inggris',
  'Bahan bakar (BBM) tanpa batasan jarak tempuh',
  'Air mineral dingin selama perjalanan',
  'Kendaraan bersih, wangi, dan rutin diservis',
];

const EXCLUDED_COMMON = [
  'Tiket masuk objek wisata & atraksi',
  'Biaya parkir di lokasi wisata',
  'Biaya tol (bila melewati jalan tol Bali Mandara)',
  'Biaya area di luar area standar (lihat tabel di bawah)',
  'Lembur pemakaian di luar durasi yang dipilih',
];

export const FLEET_DETAILS: FleetDetail[] = [
  {
    slug: 'sewa-innova-zenix-bali',
    brand: 'Toyota',
    model: 'Innova Zenix Q Hybrid',
    fullName: 'Toyota Innova Zenix Q Hybrid',
    bodyType: 'MPV Premium (7 Penumpang)',
    year: '2023 – sekarang',
    color: 'Hitam / Putih (sesuai ketersediaan)',
    fuel: 'Bensin Hybrid (HEV)',
    transmission: 'Otomatis (CVT)',
    luggage: '± 3 koper sedang + 2 tas kabin',
    seatConfig: 'Captain seat baris kedua (2 + 2 + 3)',
    tagline: 'MPV hybrid premium dengan captain seat — pilihan favorit untuk keluarga dan perjalanan bisnis.',
    overview: [
      'Toyota Innova Zenix Q Hybrid adalah generasi terbaru Innova dengan platform monokok, kabin lebih senyap, dan konsumsi bahan bakar hybrid yang efisien. Varian Q menjadi trim tertinggi dengan captain seat baris kedua, sehingga penumpang di belakang tetap nyaman meski perjalanan seharian keliling Bali.',
      'Armada ini cocok untuk keluarga 4–5 orang yang ingin kabin lega dengan akses mudah ke baris ketiga, maupun tamu bisnis yang butuh kendaraan tenang dan rapi. Semua unit dilengkapi supir berpengalaman HAYBALI TRANS yang hafal rute Bali Selatan, Ubud, hingga Kintamani.',
    ],
    highlights: [
      'Captain seat baris kedua dengan armrest — kenyamanan setara MPV premium',
      'Mesin hybrid: perjalanan lebih halus dan konsumsi BBM lebih efisien',
      'Kabin senyap dengan panoramic sunroof pada unit Q',
      'Bagasi masih memadai untuk koper keluarga meski baris ketiga terpakai',
      'Cocok untuk perjalanan jauh ke Kintamani, Bedugul, atau Karangasem',
    ],
    interiorFeatures: [
      'Captain seat baris kedua (kulit sintetis)',
      'Panoramic sunroof',
      'Head unit layar sentuh dengan Apple CarPlay & Android Auto',
      'Wireless charger & beberapa port USB',
      'AC digital double blower dengan ventilasi baris ketiga',
      'Kamera belakang & sensor parkir',
      'Power back door',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/innova-zenix.jpg'],
  },
  {
    slug: 'sewa-innova-zenix-v-bali',
    brand: 'Toyota',
    model: 'Innova Zenix V',
    fullName: 'Toyota Innova Zenix V',
    bodyType: 'MPV Premium (7 Penumpang)',
    year: '2023 – sekarang',
    color: 'Hitam / Silver / Putih (sesuai ketersediaan)',
    fuel: 'Bensin',
    transmission: 'Otomatis (CVT)',
    luggage: '± 3 koper sedang + 2 tas kabin',
    seatConfig: 'Jok baris kedua model bench (2 + 3 + 2)',
    tagline: 'Versi value dari Innova Zenix — kabin lega dan modern dengan harga sewa lebih bersahabat.',
    overview: [
      'Toyota Innova Zenix V memakai bodi dan kabin yang sama dengan varian Q, namun dengan konfigurasi jok bench pada baris kedua dan kelengkapan yang lebih sederhana. Hasilnya: kendaraan modern, lega, dan senyap dengan biaya sewa yang lebih efisien.',
      'Pilihan tepat untuk keluarga 4–5 orang yang mengutamakan ruang dan kenyamanan tanpa perlu tambahan fitur premium. Tetap ditangani supir profesional HAYBALI TRANS, dengan BBM dan air mineral sudah termasuk dalam harga sewa.',
    ],
    highlights: [
      'Kabin senyap khas generasi Zenix dengan ruang kaki lega',
      'Baris kedua model bench — praktis untuk keluarga dengan anak',
      'Harga sewa lebih ringan dibanding varian Q',
      'Cocok untuk rute jauh maupun pemakaian dalam kota',
      'Bagasi luas untuk koper dan perlengkapan bayi',
    ],
    interiorFeatures: [
      'Jok baris kedua model bench (60:40 split)',
      'Head unit layar sentuh dengan Apple CarPlay & Android Auto',
      'AC digital double blower',
      'Port USB untuk pengisian daya',
      'Kamera belakang & sensor parkir',
      'Kaca film untuk kenyamanan kabin',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/innova-zenix-v.jpg'],
  },
  {
    slug: 'sewa-alphard-hev-bali',
    brand: 'Toyota',
    model: 'Alphard Hybrid New',
    fullName: 'Toyota Alphard Hybrid New',
    bodyType: 'MPV Luxury (7 Penumpang)',
    year: '2024 – sekarang',
    color: 'Hitam / Putih (sesuai ketersediaan)',
    fuel: 'Bensin Hybrid (HEV)',
    transmission: 'Otomatis (e-CVT)',
    luggage: '± 2 koper besar + 2 tas kabin',
    seatConfig: 'Executive lounge seat baris kedua (2 + 2 + 3)',
    tagline: 'Standar VIP eksekutif — Alphard hybrid terbaru dengan executive lounge seat.',
    overview: [
      'Toyota Alphard Hybrid New generasi terbaru adalah ikon transportasi eksekutif di Bali. Baris kedua memakai executive lounge seat dengan ottoman dan sandaran elektrik, sehingga penumpang bisa beristirahat penuh selama perjalanan dari bandara menuju hotel atau selama city tour.',
      'Armada ini paling sering dipakai untuk penjemputan VIP, kunjungan bisnis, hingga pernikahan. Kabin kedap suara dengan suspensi halus membuat perjalanan panjang terasa ringan, sementara supir HAYBALI TRANS sudah terbiasa menangani tamu korporat dan diplomatik.',
    ],
    highlights: [
      'Executive lounge seat dengan ottoman & pengaturan elektrik',
      'Kabin paling senyap di kelasnya, ideal untuk perjalanan jauh',
      'Pintu geser elektrik kedua sisi untuk akses yang sopan dan mudah',
      'Tampil prestisius untuk penjemputan VIP, bisnis, dan acara resmi',
      'Supir berpengalaman dalam menangani tamu korporat',
    ],
    interiorFeatures: [
      'Executive lounge seat baris kedua dengan ottoman',
      'Panoramic sunroof',
      'Dual power sliding door & power back door',
      'Wireless charger dan port USB-C',
      'Head unit layar besar dengan Apple CarPlay & Android Auto',
      'Jok kulit dengan pengaturan elektrik',
      'Ambient lighting kabin',
      'AC tiga zona dengan ventilasi baris ketiga',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/alphard-hev.jpg'],
  },
  {
    slug: 'sewa-alphard-vachelift-bali',
    brand: 'Toyota',
    model: 'Alphard Facelift 2.5 G',
    fullName: 'Toyota Alphard Facelift 2.5 G',
    bodyType: 'MPV Luxury (7 Penumpang)',
    year: '2018 – 2023 (facelift)',
    color: 'Hitam (sesuai ketersediaan)',
    fuel: 'Bensin',
    transmission: 'Otomatis (CVT)',
    luggage: '± 2 koper besar + 2 tas kabin',
    seatConfig: 'Captain seat baris kedua dengan ottoman (2 + 2 + 3)',
    tagline: 'Alphard facelift dengan captain seat — nuansa VIP dengan tarif lebih efisien.',
    overview: [
      'Toyota Alphard Facelift 2.5 G menghadirkan kesan eksekutif khas Alphard dengan biaya sewa yang lebih ringan dibanding generasi hybrid terbaru. Baris kedua berupa captain seat ber-ottoman, dan kabinnya tetap lega serta senyap untuk ukuran MPV luxury.',
      'Cocok untuk tamu yang menginginkan pengalaman VIP — penjemputan bandara, acara keluarga, atau city tour — tanpa harus mengambil seri tertinggi. Unit dirawat berkala dan selalu dalam kondisi bersih sebelum berangkat.',
    ],
    highlights: [
      'Captain seat baris kedua dengan ottoman',
      'Nuansa eksekutif Alphard dengan tarif lebih ringan',
      'Pintu geser elektrik kedua sisi',
      'Kabin lega dan senyap untuk 4–5 penumpang',
      'Favorit untuk penjemputan bandara dan acara keluarga',
    ],
    interiorFeatures: [
      'Captain seat baris kedua dengan ottoman',
      'Sunroof',
      'Dual power sliding door',
      'Jok kulit',
      'Head unit layar sentuh dengan Bluetooth & Apple CarPlay',
      'AC otomatis dengan ventilasi baris ketiga',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/alphard-vachelift.jpg'],
  },
  {
    slug: 'sewa-innova-reborn-bali',
    brand: 'Toyota',
    model: 'Innova Reborn 2.4',
    fullName: 'Toyota Innova Reborn 2.4',
    bodyType: 'MPV (7 Penumpang)',
    year: '2016 – 2022',
    color: 'Hitam / Silver / Putih (sesuai ketersediaan)',
    fuel: 'Diesel',
    transmission: 'Manual / Otomatis (sesuai unit)',
    luggage: '± 3 koper sedang + 2 tas kabin',
    seatConfig: 'Jok baris kedua model bench (2 + 3 + 2)',
    tagline: 'MPV diesel yang tangguh dan irit — andalan untuk perjalanan jauh keliling Bali.',
    overview: [
      'Toyota Innova Reborn 2.4 dikenal bandel dan efisien untuk medan Bali yang berbukit. Torsi dieselnya kuat saat menanjak ke Kintamani atau Bedugul, sementara ruang kabin dan bagasi tetap lega untuk keluarga maupun rombongan kecil.',
      'Armada ini hanya tersedia untuk paket 12 jam karena paling optimal dipakai perjalanan sehari penuh. Perawatan rutin dan pemeriksaan sebelum berangkat menjadi standar HAYBALI TRANS untuk semua unit.',
    ],
    highlights: [
      'Mesin diesel bertenaga untuk medan menanjak',
      'Konsumsi BBM efisien untuk perjalanan jauh',
      'Kabin dan bagasi lega untuk keluarga',
      'Ground clearance aman untuk rute pegunungan',
      'Tersedia khusus paket 12 jam — optimal untuk day trip',
    ],
    interiorFeatures: [
      'Jok baris kedua model bench',
      'AC double blower hingga baris ketiga',
      'Head unit layar sentuh',
      'Port USB untuk pengisian daya',
      'Kaca film dan tirai samping',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/innova-reborn.jpg'],
  },
  {
    slug: 'sewa-toyota-hiace-bali',
    brand: 'Toyota',
    model: 'HiAce Premio 2.8',
    fullName: 'Toyota HiAce Premio 2.8',
    bodyType: 'Van Semi-Luxury (14 Penumpang)',
    year: '2020 – sekarang',
    color: 'Putih (sesuai ketersediaan)',
    fuel: 'Diesel',
    transmission: 'Otomatis (AT)',
    luggage: '± 6 koper sedang di area belakang',
    seatConfig: '10 penumpang direkomendasikan (maks. 14 tanpa bagasi)',
    tagline: 'Van semi-luxury paling nyaman untuk rombongan — jok lebar dan kabin tinggi.',
    overview: [
      'Toyota HiAce Premio adalah versi semi-luxury dari HiAce dengan jok lebih lebar, kabin lebih tinggi, dan suspensi yang lebih nyaman. Pilihan utama untuk rombongan keluarga besar, tim bisnis, atau tamu undangan yang datang bersama-sama.',
      'Dengan kapasitas ideal 10 penumpang plus bagasi, Premio tetap nyaman untuk perjalanan jauh seperti Ubud – Kintamani – Bedugul dalam satu hari. Semua unit dilengkapi supir berpengalaman yang terbiasa menangani grup.',
    ],
    highlights: [
      'Kabin tinggi — penumpang bisa berdiri setengah badan saat masuk',
      'Jok lebih lebar dan empuk dibanding HiAce Commuter',
      'Ideal untuk rombongan 10 orang beserta koper',
      'Suspensi nyaman untuk perjalanan jauh antar kabupaten',
      'Tersedia khusus paket 12 jam',
    ],
    interiorFeatures: [
      'Jok berbalut kulit sintetis dengan headrest',
      'AC blower merata hingga baris belakang',
      'Pintu geser samping lebar',
      'Ruang bagasi belakang untuk koper rombongan',
      'Port USB dan lampu kabin',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/hiace.jpg'],
  },
  {
    slug: 'sewa-hiace-commuter-bali',
    brand: 'Toyota',
    model: 'HiAce Commuter 3.0',
    fullName: 'Toyota HiAce Commuter 3.0',
    bodyType: 'Van (14 Penumpang)',
    year: '2015 – sekarang',
    color: 'Putih (sesuai ketersediaan)',
    fuel: 'Diesel',
    transmission: 'Manual',
    luggage: '± 6 koper sedang di area belakang',
    seatConfig: '10 penumpang direkomendasikan (maks. 14 tanpa bagasi)',
    tagline: 'Van rombongan paling ekonomis — pilihan hemat untuk grup besar.',
    overview: [
      'Toyota HiAce Commuter 3.0 adalah pilihan paling ekonomis untuk memindahkan banyak orang dalam satu kendaraan. Cocok untuk rombongan wisata, keluarga besar, atau tamu acara yang perlu berpindah lokasi bersama-sama.',
      'Meski lebih sederhana dibanding Premio, unit Commuter HAYBALI TRANS tetap dirawat rutin, dibersihkan setiap selesai trip, dan dikemudikan supir berpengalaman. Tersedia paket 6 jam atau 12 jam.',
    ],
    highlights: [
      'Biaya per orang paling efisien untuk rombongan besar',
      'Kapasitas hingga 14 penumpang tanpa bagasi',
      'Mesin diesel 3.0 bertenaga untuk rute berbukit',
      'Cocok untuk grup wisata dan acara keluarga besar',
      'Tersedia paket 6 jam atau 12 jam',
    ],
    interiorFeatures: [
      'Jok berbaris dengan headrest',
      'AC blower hingga baris belakang',
      'Pintu geser samping',
      'Ruang bagasi belakang',
      'Lampu kabin',
      'Kebijakan bebas rokok di dalam kabin',
    ],
    included: INCLUDED_COMMON,
    excluded: EXCLUDED_COMMON,
    gallery: ['/images/haybali/hiace-commuter.jpg'],
  },
];

/** Cari konten detail armada berdasarkan slug produk. */
export function getFleetDetail(slug: string): FleetDetail | undefined {
  return FLEET_DETAILS.find((d) => d.slug === slug);
}
