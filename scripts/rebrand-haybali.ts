// ============================================================================
// REBRAND HAYBALI TRANS
// Mengubah identitas situs dari "Jelajah Nusantara" menjadi HAYBALI TRANS:
// 1. Settings global (nama brand, judul situs, kontak, alamat, rekening).
// 2. Nonaktifkan 6 paket tour nasional lama (data tetap aman di DB).
// 3. Buat 6 paket tour Bali baru (gambar & kalimat sendiri).
// 4. Ubah 10 destinasi nasional menjadi area-area wisata Bali.
// Idempotent — aman dijalankan ulang.
// ============================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSettings() {
  const settings: Record<string, string> = {
    company_name: JSON.stringify('HAYBALI TRANS'),
    site_title: JSON.stringify('HAYBALI TRANS — Sewa Mobil & Tour Bali'),
    company_icon: JSON.stringify('/android-chrome-192x192.png'),
    company_email: JSON.stringify('info@haybalitrans.com'),
    company_phone: JSON.stringify('+6281234567890'),
    company_address: JSON.stringify('Denpasar / Kuta, Bali - Indonesia'),
    bank_accounts: JSON.stringify([
      { bank: 'BCA', number: '1234567890', name: 'HAYBALI TRANS' },
      { bank: 'Mandiri', number: '0987654321', name: 'HAYBALI TRANS' },
    ]),
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log('Setting updated:', key);
  }
}

async function deactivateLegacyTours() {
  const legacySlugs = [
    '3d2n-bali-exotic-tour',
    '2d1n-bromo-sunrise',
    '3d2n-yogyakarta-heritage',
    '5d4n-raja-ampat-paradise',
    '4d3n-lombok-adventure',
    '3d2n-labuan-bajo-premium',
  ];
  const res = await prisma.tour.updateMany({
    where: { slug: { in: legacySlugs } },
    data: { isActive: false },
  });
  console.log('Legacy tours deactivated:', res.count);
}

const NEW_TOURS = [
  {
    name: '3D2N Honeymoon Ubud & Uluwatu',
    slug: 'honeymoon-ubud-uluwatu-3d2n',
    category: 'HONEYMOON',
    destination: 'Bali',
    duration: '3 Hari 2 Malam',
    priceAdult: 4950000,
    priceChild: 0,
    discount: 0,
    maxSlot: 8,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Villa & Ubud Romantis', description: 'Penjemputan di bandara, check-in villa pribadi berkolam renang di Ubud, makan siang di restoran tepi sawah, sore santai di Tegallalang, makan malam romantis ditemani lilin.' },
      { day: 2, title: 'Ubud Culture & Spa', description: 'Sarapan di villa, kunjungi Monkey Forest dan Pura Tirta Empul, lalu sesi spa pasangan 90 menit. Sorenya transfer ke villa di Uluwatu dengan pemandangan samudra.' },
      { day: 3, title: 'Sunset Uluwatu - Transfer Out', description: 'Brunch santai, menuju Pura Uluwatu untuk menyaksikan Tari Kecak saat matahari terbenam, kemudian transfer ke bandara.' },
    ]),
    includes: JSON.stringify([
      'Villa pribadi 2 malam (kolam renang)',
      'Mobil private + supir',
      'Sarapan & romantic dinner',
      'Spa pasangan 90 menit',
      'Tiket masuk objek wisata',
      'Dekorasi kamar & bunga',
    ]),
    excludes: JSON.stringify(['Tiket pesawat', 'Asuransi perjalanan', 'Minuman beralkohol', 'Pengeluaran pribadi']),
    terms: '<p>Khusus pasangan (minimal 2 orang). Harga per orang. Pemesanan minimal H-7 sebelum keberangkatan.</p>',
    isActive: false,
    sortOrder: 9,
    coverImg: '/images/haybali/honeymoon-ubud.png',
  },
  {
    name: '2D1N Nusa Penida Adventure',
    slug: 'nusa-penida-adventure-2d1n',
    category: 'OPEN_TRIP',
    destination: 'Bali',
    duration: '2 Hari 1 Malam',
    priceAdult: 1450000,
    priceChild: 950000,
    discount: 0,
    maxSlot: 12,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Kelingking & Pantai Selatan', description: 'Fastboat dari Sanur, langsung menuju Kelingking Beach, Angel\'s Billabong, dan Broken Beach. Check-in hotel, makan malam seafood segar.' },
      { day: 2, title: 'Snorkeling & Kembali', description: 'Snorkeling di Crystal Bay dan Manta Point (beruntung bisa bertemu manta), kembali ke Bali dengan fastboat sore hari.' },
    ]),
    includes: JSON.stringify([
      'Fastboat pulang-pergi',
      'Hotel 1 malam',
      'Transport di pulau',
      'Peralatan snorkeling',
      'Makan sesuai program',
      'Tiket masuk objek wisata',
      'Pemandu lokal',
    ]),
    excludes: JSON.stringify(['Fotografer pribadi', 'Pengeluaran pribadi']),
    terms: '<p>Minimal 2 peserta. Jadwal fastboat mengikuti kondisi cuaca.</p>',
    isActive: false,
    sortOrder: 10,
    coverImg: '/images/haybali/nusa-penida.png',
  },
  {
    name: '3D2N Lovina Dolphin & Bedugul',
    slug: 'lovina-dolphin-bedugul-3d2n',
    category: 'OPEN_TRIP',
    destination: 'Bali',
    duration: '3 Hari 2 Malam',
    priceAdult: 2250000,
    priceChild: 1450000,
    discount: 0,
    maxSlot: 12,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Bali Tengah & Bedugul', description: 'Penjemputan di area Kuta/Sanur/Ubud, singgah di Tanah Lot, lanjut ke Pura Ulun Danu Beratan di Bedugul, check-in hotel di Lovina.' },
      { day: 2, title: 'Dolphin Sunrise & Air Terjun', description: 'Berangkat subuh dengan jukung mengejar lumba-lumba, sarapan, kunjungi Air Terjun Gitgit dan pemandian air panas Banjar, sore bebas di pantai Lovina.' },
      { day: 3, title: 'Danau Kembar - Transfer Out', description: 'Mengunjungi Danau Kembar Tamblingan & Buyan serta Wanagiri Hidden Hills, kemudian kembali ke area penginapan Anda.' },
    ]),
    includes: JSON.stringify([
      'Mobil private + supir',
      'Hotel 2 malam',
      'Tur lumba-lumba dengan jukung',
      'Tiket masuk objek wisata',
      'Makan sesuai program',
    ]),
    excludes: JSON.stringify(['Makan malam', 'Pengeluaran pribadi']),
    terms: '<p>Minimal 2 peserta. Tur lumba-lumba tergantung cuaca dan musim.</p>',
    isActive: false,
    sortOrder: 11,
    coverImg: '/images/haybali/lovina-dolphin.png',
  },
  {
    name: '2D1N Bali Timur Eksotis',
    slug: 'bali-timur-eksotis-2d1n',
    category: 'OPEN_TRIP',
    destination: 'Bali',
    duration: '2 Hari 1 Malam',
    priceAdult: 1650000,
    priceChild: 1050000,
    discount: 0,
    maxSlot: 12,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Gerbang Surga & Istana Air', description: 'Berangkat pagi ke Pura Lempuyang (Gerbang Surga), lanjut ke Taman Tirta Gangga, lalu Sidemen dengan sawah teraseringnya. Check-in penginapan di Sidemen.' },
      { day: 2, title: 'Tukad Cepung & Kembali', description: 'Sunrise di air terjun Tukad Cepung, kunjungi Desa Penglipuran yang asri, kemudian kembali ke area Anda.' },
    ]),
    includes: JSON.stringify([
      'Mobil private + supir',
      'Penginapan 1 malam',
      'Tiket masuk objek wisata',
      'Sarapan & makan siang',
      'Air mineral',
    ]),
    excludes: JSON.stringify(['Fotografer pribadi', 'Pengeluaran pribadi']),
    terms: '<p>Minimal 2 peserta. Lempuyang ramai saat musim liburan — disarankan berangkat dini hari.</p>',
    isActive: false,
    sortOrder: 12,
    coverImg: '/images/haybali/bali-timur.png',
  },
  {
    name: '4D3N Bali Round Trip',
    slug: 'bali-round-trip-4d3n',
    category: 'PRIVATE_TRIP',
    destination: 'Bali',
    duration: '4 Hari 3 Malam',
    priceAdult: 3950000,
    priceChild: 2450000,
    discount: 0,
    maxSlot: 10,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Uluwatu & Bali Selatan', description: 'Penjemputan di bandara, kunjungi Pantai Melasti, Pura Uluwatu, dan Tari Kecak saat matahari terbenam. Check-in hotel di Nusa Dua.' },
      { day: 2, title: 'Ubud & Kintamani', description: 'Tegallalang Rice Terrace, Monkey Forest, lanjut ke Kintamani untuk makan siang menghadap Gunung Batur, tutup hari di Ubud.' },
      { day: 3, title: 'Bali Utara', description: 'Munduk, Danau Kembar Tamblingan & Buyan, dan Wanagiri Hidden Hills. Bermalam di kawasan Lovina.' },
      { day: 4, title: 'Dolphin & Transfer Out', description: 'Tur lumba-lumba subuh di Lovina, sarapan, kemudian transfer kembali ke bandara atau area Anda.' },
    ]),
    includes: JSON.stringify([
      'Mobil private + supir 4 hari',
      'Hotel 3 malam',
      'Tiket masuk semua destinasi',
      'Makan sesuai program',
      'Dokumentasi perjalanan',
    ]),
    excludes: JSON.stringify(['Tiket pesawat', 'Makan malam', 'Pengeluaran pribadi']),
    terms: '<p>Minimal 2 peserta. Jadwal fleksibel menyesuaikan preferensi Anda.</p>',
    isActive: false,
    sortOrder: 13,
    coverImg: '/images/haybali/bali-roundtrip.png',
  },
  {
    name: '2D1N Nusa Dua Water Sport & Beach Club',
    slug: 'nusa-dua-water-sport-2d1n',
    category: 'PRIVATE_TRIP',
    destination: 'Bali',
    duration: '2 Hari 1 Malam',
    priceAdult: 1850000,
    priceChild: 1150000,
    discount: 0,
    maxSlot: 12,
    minPax: 2,
    itinerary: JSON.stringify([
      { day: 1, title: 'Water Sport Nusa Dua', description: 'Penjemputan di area Anda, paket water sport di Tanjung Benoa (banana boat, parasailing, jet ski), check-in hotel, sore santai di beach club.' },
      { day: 2, title: 'Pandawa & Kembali', description: 'Sarapan, kunjungi Pantai Pandawa dan Melasti, kemudian transfer kembali ke area Anda.' },
    ]),
    includes: JSON.stringify([
      'Paket water sport (3 permainan)',
      'Hotel 1 malam',
      'Transport private',
      'Tiket masuk pantai',
      'Sarapan',
    ]),
    excludes: JSON.stringify(['Makan siang & malam', 'Permainan tambahan', 'Pengeluaran pribadi']),
    terms: '<p>Minimal 2 peserta. Aktivitas water sport mengikuti kondisi cuaca.</p>',
    isActive: false,
    sortOrder: 14,
    coverImg: '/images/haybali/nusa-dua.png',
  },
];

async function createNewTours() {
  for (const tour of NEW_TOURS) {
    await prisma.tour.upsert({
      where: { slug: tour.slug },
      update: tour,
      create: tour,
    });
    console.log('Tour baru siap:', tour.name);
  }
}

const NEW_DESTINATIONS: { oldSlug: string; data: Record<string, unknown> }[] = [
  {
    oldSlug: 'bali',
    data: {
      name: 'Bali',
      slug: 'bali',
      shortDescription: 'Pulau Dewata — pusat layanan HAYBALI TRANS untuk sewa mobil, paket tour, dan antar-jemput bandara.',
      description: '<h2>Pulau Dewata, Rumah HAYBALI TRANS</h2><p>Bali adalah destinasi wisata paling terkenal di Indonesia, dan sekaligus markas layanan kami. Dari bandara Ngurah Rai, HAYBALI TRANS siap mengantar Anda menjelajahi seluruh penjuru pulau — dari pantai selatan yang semarak hingga pegunungan utara yang sejuk.</p><p>Kombinasi budaya, alam, dan keramahan lokal menjadikan Bali tujuan sempurna untuk liburan keluarga, honeymoon, maupun perjalanan bisnis.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pura Tanah Lot saat matahari terbenam</li><li>Tegallalang Rice Terrace di Ubud</li><li>Pura Uluwatu dengan pertunjukan Tari Kecak</li><li>Pantai Nusa Dua dan Pandawa</li><li>Kintamani dengan panorama Gunung Batur</li></ul><h3>Tips Berkunjung</h3><p>Gunakan layanan supir pribadi HAYBALI TRANS agar perjalanan nyaman tanpa repot. Hormati adat setempat saat memasuki area pura, dan bawa pakaian sopan untuk kunjungan ke tempat suci.</p>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/hero-bali.png',
      gallery: JSON.stringify(['/images/haybali/hero-bali.png', '/images/haybali/bali-roundtrip.png', '/images/haybali/honeymoon-ubud.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Sewa Mobil + Supir', 'Antar-Jemput Bandara', 'Paket Tour Harian', 'Snorkeling', 'Wisata Budaya', 'Honeymoon']),
      highlight: true,
      sortOrder: 1,
    },
  },
  {
    oldSlug: 'raja-ampat',
    data: {
      name: 'Ubud',
      slug: 'ubud',
      shortDescription: 'Jantung budaya Bali dengan sawah terasering, seni, dan suasana villa yang menenangkan.',
      description: '<h2>Jantung Budaya Bali</h2><p>Ubud adalah pusat seni dan spiritual Bali. Dikelilingi sawah terasering hijau dan hutan tropis, Ubud menawarkan pengalaman yang menenangkan — yoga, spa, galeri seni, dan kuliner sehat.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Tegallalang Rice Terrace</li><li>Monkey Forest Ubud</li><li>Pura Tirta Empul</li><li>Pasar Seni Ubud</li><li>Campuhan Ridge Walk</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/ubud.png',
      gallery: JSON.stringify(['/images/haybali/ubud.png', '/images/haybali/honeymoon-ubud.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Wisata Budaya', 'Spa & Yoga', 'Fotografi', 'Wisata Kuliner', 'Bersepeda']),
      highlight: true,
      sortOrder: 2,
    },
  },
  {
    oldSlug: 'yogyakarta',
    data: {
      name: 'Nusa Penida',
      slug: 'nusa-penida',
      shortDescription: 'Pulau eksotis dengan tebing dramatis, pantai tersembunyi, dan snorkeling kelas dunia.',
      description: '<h2>Petualangan Pulau Eksotis</h2><p>Nusa Penida adalah pulau di tenggara Bali yang terkenal dengan Kelingking Beach — tebing berbentuk T-Rex yang ikonik. Pulau ini juga menawarkan snorkeling bersama manta dan pantai-pantai tersembunyi yang menakjubkan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Kelingking Beach</li><li>Angel\'s Billabong & Broken Beach</li><li>Crystal Bay</li><li>Manta Point</li><li>Diamond Beach</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/nusa-penida.png',
      gallery: JSON.stringify(['/images/haybali/nusa-penida.png', '/images/haybali/nusa-penida-bay.png']),
      bestTimeToVisit: 'April - November',
      activities: JSON.stringify(['Snorkeling', 'Fotografi', 'Island Hopping', 'Trekking Ringan']),
      highlight: true,
      sortOrder: 3,
    },
  },
  {
    oldSlug: 'lombok',
    data: {
      name: 'Uluwatu',
      slug: 'uluwatu',
      shortDescription: 'Tebing karang megah, pantai surfing legendaris, dan sunset Tari Kecak yang memukau.',
      description: '<h2>Tebing Karang & Sunset Legendaris</h2><p>Uluwatu di ujung selatan Bali adalah rumah bagi Pura Luhur Uluwatu yang bertengger di tebing setinggi 70 meter. Setiap sore, pertunjukan Tari Kecak dengan latar matahari terbenam menjadi momen yang tak terlupakan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pura Luhur Uluwatu</li><li>Pantai Padang-Padang</li><li>Pantai Bingin</li><li>Pantai Melasti</li><li>Suluban Beach</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/bali-roundtrip.png',
      gallery: JSON.stringify(['/images/haybali/bali-roundtrip.png', '/images/haybali/uluwatu-beach.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Surfing', 'Tari Kecak', 'Fotografi Sunset', 'Beach Club']),
      highlight: true,
      sortOrder: 4,
    },
  },
  {
    oldSlug: 'labuan-bajo',
    data: {
      name: 'Kintamani',
      slug: 'kintamani',
      shortDescription: 'Dataran tinggi dengan panorama Gunung Batur dan Danau Batur yang menakjubkan.',
      description: '<h2>Panorama Gunung & Danau Batur</h2><p>Kintamani adalah dataran tinggi di Bali tengah yang menyajikan pemandangan Gunung Batur dan Danau Batur dari ketinggian. Udara sejuknya menjadikan kawasan ini favorit untuk makan siang sambil menikmati panorama.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Penelokan Viewpoint</li><li>Gunung Batur</li><li>Desa Trunyan</li><li>Pemandian Air Panas Toya Devasya</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/kintamani.png',
      gallery: JSON.stringify(['/images/haybali/kintamani.png', '/images/haybali/bedugul.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Trekking', 'Fotografi', 'Air Panas', 'Wisata Desa']),
      highlight: false,
      sortOrder: 5,
    },
  },
  {
    oldSlug: 'bromo',
    data: {
      name: 'Lovina',
      slug: 'lovina',
      shortDescription: 'Pantai tenang di Bali utara dengan tur lumba-lumba saat fajar yang terkenal.',
      description: '<h2>Tenangnya Bali Utara</h2><p>Lovina adalah kawasan pantai tenang di Bali utara dengan pasir hitam vulkaniknya. Daya tarik utamanya adalah tur lumba-lumba saat fajar menggunakan jukung tradisional — pengalaman yang tak terlupakan bersama keluarga.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Tur Lumba-lumba Subuh</li><li>Air Terjun Gitgit</li><li>Pemandian Air Panas Banjar</li><li>Brahma Vihara Arama</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/lovina-dolphin.png',
      gallery: JSON.stringify(['/images/haybali/lovina-dolphin.png', '/images/haybali/sanur.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Tur Lumba-lumba', 'Snorkeling', 'Air Panas', 'Fotografi']),
      highlight: false,
      sortOrder: 6,
    },
  },
  {
    oldSlug: 'danau-toba',
    data: {
      name: 'Canggu',
      slug: 'canggu',
      shortDescription: 'Surga digital nomad dengan pantai surfing, kafe kekinian, dan sunset spektakuler.',
      description: '<h2>Energi Muda Bali</h2><p>Canggu adalah kawasan pesisir yang semarak dengan budaya surfing, kafe sehat, dan komunitas digital nomad dari seluruh dunia. Pantainya menawarkan ombak untuk semua level peselancar.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Batu Bolong Beach</li><li>Echo Beach</li><li>Tanah Lot (15 menit berkendara)</li><li>La Brisa Beach Club</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/canggu.png',
      gallery: JSON.stringify(['/images/haybali/canggu.png', '/images/haybali/hero-bali.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Surfing', 'Kuliner', 'Beach Club', 'Yoga', 'Fotografi']),
      highlight: false,
      sortOrder: 7,
    },
  },
  {
    oldSlug: 'wakatobi',
    data: {
      name: 'Sanur',
      slug: 'sanur',
      shortDescription: 'Pantai timur yang tenang — pintu gerbang fastboat ke Nusa Penida dan Nusa Lembongan.',
      description: '<h2>Ketenangan Pantai Timur</h2><p>Sanur dikenal dengan matahari terbitnya yang indah dan jalur pejalan kaki sepanjang pantai yang nyaman. Pelabuhan Sanur juga menjadi gerbang utama fastboat menuju Nusa Penida dan Nusa Lembongan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pantai Sanur & Sunrise</li><li>Pelabuhan Sanur</li><li>Sindhu Night Market</li><li>Museum Le Mayeur</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/sanur.png',
      gallery: JSON.stringify(['/images/haybali/sanur.png', '/images/haybali/nusa-penida.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Sunrise Viewing', 'Bersepeda', 'Snorkeling Trip', 'Kuliner']),
      highlight: false,
      sortOrder: 8,
    },
  },
  {
    oldSlug: 'banda-neira',
    data: {
      name: 'Nusa Dua',
      slug: 'nusa-dua',
      shortDescription: 'Kawasan resor mewah dengan pantai putih, water sport, dan beach club kelas dunia.',
      description: '<h2>Kemewahan Bali Selatan</h2><p>Nusa Dua adalah kawasan resor bintang lima dengan pantai pasir putih yang terawat sempurna. Tanjung Benoa di sebelahnya adalah pusat water sport Bali — dari banana boat hingga parasailing.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pantai Nusa Dua</li><li>Tanjung Benoa Water Sport</li><li>Pantai Pandawa</li><li>Water Blow</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/nusa-dua.png',
      gallery: JSON.stringify(['/images/haybali/nusa-dua.png', '/images/haybali/hero-bali.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Water Sport', 'Beach Club', 'Bersantai', 'Golf', 'Belanja']),
      highlight: true,
      sortOrder: 9,
    },
  },
  {
    oldSlug: 'belitung',
    data: {
      name: 'Bedugul',
      slug: 'bedugul',
      shortDescription: 'Kawasan pegunungan sejuk dengan danau suci, kebun raya, dan pura terapung yang ikonik.',
      description: '<h2>Sejuknya Pegunungan Bali</h2><p>Bedugul adalah kawasan pegunungan dengan udara sejuk dan pemandangan danau yang memesona. Ikon utamanya adalah Pura Ulun Danu Beratan yang tampak mengapung di atas Danau Beratan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pura Ulun Danu Beratan</li><li>Danau Kembar Tamblingan & Buyan</li><li>Wanagiri Hidden Hills</li><li>Kebun Raya Bali</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/bedugul.png',
      gallery: JSON.stringify(['/images/haybali/bedugul.png', '/images/haybali/kintamani.png']),
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Wisata Alam', 'Fotografi', 'Bersepeda', 'Piknik']),
      highlight: false,
      sortOrder: 10,
    },
  },
];

async function rebrandDestinations() {
  for (const item of NEW_DESTINATIONS) {
    const existing = await prisma.destination.findUnique({ where: { slug: item.oldSlug } });
    if (!existing) {
      console.log('SKIP (tidak ditemukan):', item.oldSlug);
      continue;
    }
    await prisma.destination.update({
      where: { id: existing.id },
      data: item.data,
    });
    console.log('Destination diubah:', item.oldSlug, '→', item.data.slug);
  }
}

// rebrandDestinations() hanya jalan untuk rename pertama (oldSlug tidak ada lagi setelah
// rename). Fungsi ini menyinkronkan ulang data (gambar/gallery/deskripsi) 4 destinasi aktif
// berdasarkan slug barunya — idempotent, aman dijalankan berulang.
const ACTIVE_DESTINATION_SLUGS = ['kintamani', 'ubud', 'uluwatu', 'nusa-penida'];

async function syncActiveDestinations() {
  for (const slug of ACTIVE_DESTINATION_SLUGS) {
    const item = NEW_DESTINATIONS.find((d) => d.data.slug === slug);
    if (!item) continue;
    const existing = await prisma.destination.findUnique({ where: { slug } });
    if (!existing) continue;
    const data = item.data as Record<string, string>;
    await prisma.destination.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        location: data.location,
        imageUrl: data.imageUrl,
        gallery: data.gallery,
        bestTimeToVisit: data.bestTimeToVisit,
        activities: data.activities,
      },
    });
    console.log('Destinasi disinkronkan:', slug);
  }
}

async function updateCmsPages() {
  const pages: Record<string, unknown> = {
    tours: {
      label: 'Koleksi Kami',
      heading: 'Paket Wisata',
      subheading: 'Jelajahi berbagai pilihan paket tour HAYBALI TRANS ke destinasi terbaik di Bali',
    },
    footer: {
      text: 'Mitra transportasi dan privat tur tepercaya di Bali. Mengutamakan keselamatan, kenyamanan, dan pelayanan VIP bagi seluruh pelanggan.',
      copyright: `© ${new Date().getFullYear()} HAYBALI TRANS. All rights reserved.`,
      socialLinks: [
        { platform: 'WhatsApp', url: 'https://wa.me/6281234567890', icon: 'whatsapp' },
        { platform: 'Instagram', url: 'https://instagram.com/haybalitrans', icon: 'instagram' },
        { platform: 'Email', url: 'mailto:info@haybalitrans.com', icon: 'email' },
      ],
    },
    contact: {
      label: 'Kontak',
      heading: 'Hubungi Kami',
      subheading: 'Punya pertanyaan atau butuh bantuan memilih layanan? Tim HAYBALI TRANS siap membantu!',
      infoCards: [
        { icon: '📞', title: 'WhatsApp', detail: '+62 812-3456-7890', color: 'from-green-500 to-green-600' },
        { icon: '📧', title: 'Email', detail: 'info@haybalitrans.com', color: 'from-amber-500 to-amber-600' },
        { icon: '🕐', title: 'Jam Operasional', detail: 'Layanan Driver & WhatsApp: 24/7 Online', color: 'from-purple-500 to-purple-600' },
        { icon: '📍', title: 'Alamat', detail: 'Denpasar / Kuta, Bali - Indonesia', color: 'from-orange-500 to-orange-600' },
      ],
    },
    about: {
      label: 'Tentang',
      heading: 'Tentang Kami',
      storyTitle: 'Cerita Kami',
      story: 'HAYBALI TRANS adalah mitra transportasi dan privat tur tepercaya di Bali yang berkomitmen memberikan pengalaman liburan tak terlupakan dengan pelayanan VIP, harga transparan, dan armada yang prima.\n\nKami melayani sewa mobil mewah dengan supir berpengalaman, paket tur privat ke destinasi terbaik Bali, serta antar-jemput bandara Ngurah Rai 24/7. Dari Kintamani hingga Uluwatu, dari Lovina hingga Nusa Penida — kami siap mengantar Anda menjelajahi setiap sudut Pulau Dewata.\n\nKami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merancang setiap layanan dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.',
      vision: 'Menjadi mitra transportasi dan privat tur paling tepercaya di Bali dengan pelayanan VIP yang konsisten.',
      mission: [
        'Menyediakan armada bersih, wangi, dan terawat',
        'Memberikan pelayanan supir profesional dan ramah',
        'Harga transparan tanpa biaya tersembunyi',
        'Mempermudah proses booking dengan teknologi modern',
        'Mendukung pariwisata dan komunitas lokal Bali',
      ],
      whyUs: [
        { icon: '🚙', title: 'Armada Prima', desc: 'Kendaraan bersih, wangi, dan terawat untuk kenyamanan Anda.', color: 'bg-amber-50 text-amber-600' },
        { icon: '👨‍✈️', title: 'Supir Profesional', desc: 'Berpengalaman, ramah, dan siap melayani 24/7.', color: 'bg-green-50 text-green-600' },
        { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-purple-50 text-purple-600' },
        { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-orange-50 text-orange-600' },
        { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-teal-50 text-teal-600' },
        { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung ekowisata dan masyarakat lokal Bali.', color: 'bg-emerald-50 text-emerald-600' },
      ],
    },
  };

  for (const [slug, content] of Object.entries(pages)) {
    await prisma.page.upsert({
      where: { slug },
      update: { content: JSON.stringify(content) },
      create: { slug, title: slug, content: JSON.stringify(content) },
    });
    console.log('CMS page diperbarui:', slug);
  }
}

// Gambar armada disesuaikan dengan model aslinya (Toyota Alphard / Innova Zenix / HiAce).
// Gambar Unsplash lama tidak sesuai model (Camaro/BMW/bus) — diganti file lokal.
async function updateFleetImages() {
  const fleetImages: Record<string, string> = {
    'sewa-toyota-alphard-bali': '/images/haybali/alphard.png',
    'sewa-innova-zenix-bali': '/images/haybali/innova-zenix.png',
    'sewa-toyota-hiace-bali': '/images/haybali/hiace.png',
  };
  for (const [slug, coverImg] of Object.entries(fleetImages)) {
    await prisma.tour.update({ where: { slug }, data: { coverImg } });
  }
  console.log('Gambar armada disesuaikan dengan model aslinya');
}

// Sinkronkan section "Paket Tour Destinasi Pilihan" persis dengan materi referensi:
// hanya 4 tour harian (Kintamani, Ubud, Uluwatu, Nusa Penida) yang tampil.
// 6 paket multi-hari buatan sebelumnya dinonaktifkan (data tetap tersimpan di DB).
// Urutan katalog mengikuti materi: armada (1-3), 4 tour harian (4-7), antar-jemput (8).
async function alignPaketToursWithMaterial() {
  const order: Record<string, number> = {
    'sewa-toyota-alphard-bali': 1,
    'sewa-innova-zenix-bali': 2,
    'sewa-toyota-hiace-bali': 3,
    'kintamani-tour': 4,
    'ubud-tour': 5,
    'uluwatu-tour': 6,
    'nusa-penida-tour': 7,
    'antar-jemput-bandara-bali': 8,
  };

  for (const [slug, sortOrder] of Object.entries(order)) {
    await prisma.tour.update({ where: { slug }, data: { sortOrder } });
  }
  await prisma.tour.updateMany({
    where: { slug: { in: ['kintamani-tour', 'ubud-tour', 'uluwatu-tour', 'nusa-penida-tour'] } },
    data: { isActive: true },
  });

  // Tautkan tiap tour harian ke destinasi yang sesuai (1:1) agar halaman detail
  // destinasi menampilkan paket tournya.
  const dayTourDestinations: Record<string, string> = {
    'kintamani-tour': 'kintamani',
    'ubud-tour': 'ubud',
    'uluwatu-tour': 'uluwatu',
    'nusa-penida-tour': 'nusa-penida',
  };
  for (const [tourSlug, destSlug] of Object.entries(dayTourDestinations)) {
    const dest = await prisma.destination.findUnique({ where: { slug: destSlug } });
    if (dest) {
      await prisma.tour.update({ where: { slug: tourSlug }, data: { destinationId: dest.id } });
    }
  }
  await prisma.tour.updateMany({
    where: {
      slug: {
        in: [
          'honeymoon-ubud-uluwatu-3d2n',
          'nusa-penida-adventure-2d1n',
          'lovina-dolphin-bedugul-3d2n',
          'bali-timur-eksotis-2d1n',
          'bali-round-trip-4d3n',
          'nusa-dua-water-sport-2d1n',
        ],
      },
    },
    data: { isActive: false },
  });
  console.log('Paket tour disamakan dengan materi: 4 tour harian aktif, 6 paket multi-hari dinonaktifkan');
}

// Hanya 4 destinasi yang tampil di halaman /destinations (sesuai materi referensi:
// Kintamani, Ubud, Uluwatu, Nusa Penida). Enam area lain dinonaktifkan (data tetap tersimpan).
async function reduceDestinationsToFour() {
  const keep: Record<string, number> = {
    'kintamani': 1,
    'ubud': 2,
    'uluwatu': 3,
    'nusa-penida': 4,
  };
  const hide = ['bali', 'lovina', 'canggu', 'sanur', 'nusa-dua', 'bedugul'];

  for (const [slug, sortOrder] of Object.entries(keep)) {
    await prisma.destination.update({ where: { slug }, data: { isActive: true, sortOrder } });
  }
  await prisma.destination.updateMany({
    where: { slug: { in: hide } },
    data: { isActive: false },
  });
  console.log('Destinasi aktif dikurangi menjadi 4');
}

async function main() {
  console.log('=== REBRAND HAYBALI TRANS ===');
  await updateSettings();
  await deactivateLegacyTours();
  await createNewTours();
  await rebrandDestinations();
  await reduceDestinationsToFour();
  await syncActiveDestinations();
  await updateCmsPages();
  await updateFleetImages();
  await alignPaketToursWithMaterial();
  console.log('=== SELESAI ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
