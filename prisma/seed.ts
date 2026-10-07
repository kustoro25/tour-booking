import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user (credentials from .env)
  const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin Utama',
      email: adminEmail,
      phone: '081234567890',
      role: 'SUPER_ADMIN',
      password: hashedPassword,
    },
  });
  console.log('Admin created:', admin.email);

  // Create sample tours
  const tours = [
    {
      name: '3D2N Bali Exotic Tour',
      slug: '3d2n-bali-exotic-tour',
      category: 'PRIVATE_TRIP',
      destination: 'Bali',
      duration: '3 Hari 2 Malam',
      priceAdult: 2500000,
      priceChild: 1500000,
      discount: 10,
      maxSlot: 15,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Tiba di Bali - Ubud Tour', description: 'Penjemputan di bandara, check-in hotel, makan siang, kunjungan ke Monkey Forest Ubud, Puri Saren, dan Tegalalang Rice Terrace.' },
        { day: 2, title: 'Nusa Penida Island Tour', description: 'Fast boat ke Nusa Penida, mengunjungi Kelingking Beach, Angel Billabong, Broken Beach, dan Crystal Bay untuk snorkeling.' },
        { day: 3, title: 'Sunset di Tanah Lot - Transfer Out', description: 'Bebas sampai check-out, mengunjungi Pura Tanah Lot saat sunset, transfer ke bandara.' },
      ]),
      includes: JSON.stringify([
        'Transport AC selama tour',
        'Hotel berbintang 3 (2 malam)',
        'Makan sesuai program',
        'Tiket masuk objek wisata',
        'Guide profesional',
        'Dokumentasi selama tour',
        'Air mineral',
      ]),
      excludes: JSON.stringify([
        'Tiket pesawat',
        'Asuransi perjalanan',
        'Pengeluaran pribadi',
        'Tips guide & driver',
      ]),
      terms: '<p>Minimal pemesanan 2 orang. Pembatalan H-7 dikenakan biaya 50%. Pembatalan H-3 tidak dapat refund.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    },
    {
      name: '4D3N Lombok Adventure',
      slug: '4d3n-lombok-adventure',
      category: 'OPEN_TRIP',
      destination: 'Lombok',
      duration: '4 Hari 3 Malam',
      priceAdult: 3200000,
      priceChild: 2000000,
      discount: 0,
      maxSlot: 20,
      minPax: 4,
      itinerary: JSON.stringify([
        { day: 1, title: 'Arrival - Senggigi', description: 'Penjemputan di bandara Lombok, check-in hotel di Senggigi, santai di pantai, sunset dinner.' },
        { day: 2, title: 'Gili Islands Tour', description: 'Snorkeling di Gili Trawangan, Gili Meno, dan Gili Air. Makan siang di Gili Trawangan.' },
        { day: 3, title: 'Rinjani Trekking (Soft)', description: 'Trekking ringan ke Air Terjun Sendang Gile dan Tiu Kelep, mengunjungi Desa Tradisional Senaru.' },
        { day: 4, title: 'Souvenir & Departure', description: 'Belanja souvenir di Pasar Cakranegara, transfer ke bandara.' },
      ]),
      includes: JSON.stringify([
        'Transport AC',
        'Hotel 3 malam',
        'Makan sesuai program',
        'Snorkeling equipment',
        'Guide lokal',
        'Tiket masuk',
      ]),
      excludes: JSON.stringify(['Tiket pesawat', 'Asuransi', 'Pengeluaran pribadi']),
      terms: '<p>Minimal 4 peserta untuk keberangkatan. Jadwal bisa berubah tergantung cuaca.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1544644181-1484b3f4f62c?w=800',
    },
    {
      name: '3D2N Yogyakarta Heritage',
      slug: '3d2n-yogyakarta-heritage',
      category: 'OPEN_TRIP',
      destination: 'Yogyakarta',
      duration: '3 Hari 2 Malam',
      priceAdult: 1800000,
      priceChild: 1000000,
      discount: 5,
      maxSlot: 25,
      minPax: 3,
      itinerary: JSON.stringify([
        { day: 1, title: 'Kota Yogyakarta', description: 'Penjemputan di stasiun/bandara, kunjungan ke Keraton Yogyakarta, Taman Sari, Malioboro, dan Alun-Alun.' },
        { day: 2, title: 'Candi Borobudur & Prambanan', description: 'Sunrise di Candi Borobudur, makan siang, mengunjungi Candi Prambanan dan Candi Sewu.' },
        { day: 3, title: 'Merapi Lava Tour', description: 'Jeep tour di lereng Merapi, mengunjungi Museum Sisa Hartaku, Kaliadem bunker, transfer keluar.' },
      ]),
      includes: JSON.stringify([
        'Transport AC',
        'Hotel 2 malam',
        'Makan sesuai program',
        'Tiket masuk candi',
        'Guide lokal',
        'Jeep Merapi',
      ]),
      excludes: JSON.stringify(['Tiket pesawat/kereta', 'Asuransi', 'Pengeluaran pribadi']),
      terms: '<p>Minimal 3 peserta. Harga sudah termasuk tiket masuk semua destinasi.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1559801423-5f1e7f0c0e1b?w=800',
    },
    {
      name: '5D4N Raja Ampat Paradise',
      slug: '5d4n-raja-ampat-paradise',
      category: 'PRIVATE_TRIP',
      destination: 'Raja Ampat',
      duration: '5 Hari 4 Malam',
      priceAdult: 7500000,
      priceChild: 5000000,
      discount: 0,
      maxSlot: 10,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Arrival Sorong - Waisai', description: 'Penjemputan di bandara Sorong, ferry ke Waisai, check-in resort.' },
        { day: 2, title: 'Pianemo & Wayag', description: 'Full day tour ke Pianemo (mini Wayag) dan Wayag Island, snorkeling dan fotografi.' },
        { day: 3, title: 'Arborek & Sawingrai', description: 'Mengunjungi Desa Arborek, snorkeling di Sawingrai, melihat ikan hiu berjalan.' },
        { day: 4, title: 'Pasir Timbul & Friwen', description: 'Mengunjungi Pasir Timbul, snorkeling di Friwen Wall, BBQ di pantai.' },
        { day: 5, title: 'Departure', description: 'Check-out resort, ferry kembali ke Sorong, transfer ke bandara.' },
      ]),
      includes: JSON.stringify([
        'Transport laut & darat',
        'Resort/penginapan 4 malam',
        'Makan full board',
        'Snorkeling equipment',
        'Guide lokal',
        'Tiket konservasi',
        'Dokumentasi drone',
      ]),
      excludes: JSON.stringify(['Tiket pesawat ke Sorong', 'Asuransi', 'Tips', 'Alkohol']),
      terms: '<p>Pemesanan minimal H-14. Pembatalan H-7 dikenakan 50%.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1589330273594-fade1ee916af?w=800',
    },
    {
      name: '2D1N Bromo Sunrise',
      slug: '2d1n-bromo-sunrise',
      category: 'OPEN_TRIP',
      destination: 'Bromo',
      duration: '2 Hari 1 Malam',
      priceAdult: 900000,
      priceChild: 600000,
      discount: 0,
      maxSlot: 30,
      minPax: 5,
      itinerary: JSON.stringify([
        { day: 1, title: 'Surabaya - Bromo', description: 'Penjemputan di Surabaya/Malang, perjalanan ke kawasan Bromo, check-in penginapan.' },
        { day: 2, title: 'Sunrise Bromo - Kembali', description: 'Dini hari: Jeep ke Penanjakan untuk sunrise, lanjut ke Kawah Bromo, Pasir Berbisik, Bukit Teletubbies, kembali ke Surabaya.' },
      ]),
      includes: JSON.stringify(['Transport Jeep', 'Penginapan 1 malam', 'Snack & air mineral', 'Guide']),
      excludes: JSON.stringify(['Tiket masuk Bromo', 'Makan besar', 'Asuransi']),
      terms: '<p>Keberangkatan pukul 23:00 dari titik kumpul. Bawa jaket tebal.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800',
    },
    {
      name: '3D2N Labuan Bajo Premium',
      slug: '3d2n-labuan-bajo-premium',
      category: 'HONEYMOON',
      destination: 'Labuan Bajo',
      duration: '3 Hari 2 Malam',
      priceAdult: 5500000,
      priceChild: 3500000,
      discount: 15,
      maxSlot: 8,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Arrival - Sunset Bukit Cinta', description: 'Penjemputan di bandara Komodo, check-in resort, sunset di Bukit Cinta, romantic dinner.' },
        { day: 2, title: 'Komodo Island & Pink Beach', description: 'Speed boat ke Pulau Komodo, trekking melihat komodo, snorkeling di Pink Beach, mengunjungi Padar Island.' },
        { day: 3, title: 'Rangko Cave - Departure', description: 'Mengunjungi Gua Rangko, berenang di kolam alami, transfer ke bandara.' },
      ]),
      includes: JSON.stringify([
        'Transport AC & speed boat',
        'Resort premium 2 malam',
        'Makan full board',
        'Romantic dinner setup',
        'Guide & ranger',
        'Snorkeling gear',
        'Foto pre-wedding opsional',
      ]),
      excludes: JSON.stringify(['Tiket pesawat', 'Asuransi', 'Minuman beralkohol']),
      terms: '<p>Khusus pasangan. Pemesanan minimal H-30. Diskon 15% untuk early bird.</p>',
      isActive: true,
      coverImg: 'https://images.unsplash.com/photo-1591531892578-761f37336e71?w=800',
    },
  ];

  for (const tour of tours) {
    await prisma.tour.upsert({
      where: { slug: tour.slug },
      update: {},
      create: tour,
    });
    console.log('Tour created:', tour.name);
  }

  // ======================================================================
  // Produk HAYBALI TRANS — Sewa Mobil, Paket Tour Bali, Antar-Jemput Bandara
  // Catatan: harga paket tour per orang adalah placeholder — sesuaikan lewat
  // panel admin (harga sewa mobil & antar-jemput mengikuti daftar resmi).
  // ======================================================================
  const haybaliProducts = [
    // --- Sewa Mobil (harga per mobil / 12 jam, termasuk supir & BBM) ---
    {
      name: 'Sewa Toyota Alphard Bali',
      slug: 'sewa-toyota-alphard-bali',
      category: 'CAR_RENTAL',
      destination: 'Bali',
      duration: '12 Jam',
      priceAdult: 1800000,
      priceChild: 0,
      discount: 0,
      maxSlot: 3,
      minPax: 1,
      itinerary: JSON.stringify([
        { day: 1, title: 'Sewa Alphard + Driver', description: 'Kapasitas 6-7 penumpang. Termasuk supir berpengalaman & BBM. Interior luxury dengan air mineral. Perjalanan 12 jam, area standar (Kota/Bali Selatan/Bali Tengah) — satu wilayah per hari.' },
      ]),
      includes: JSON.stringify(['Supir berpengalaman', 'BBM', 'Air mineral', 'Interior luxury', '12 jam pemakaian']),
      excludes: JSON.stringify(['Tiket masuk objek wisata', 'Parkir & tol', 'Area terpencil (biaya tambahan)']),
      terms: '<p>Harga untuk area standar. Area terpencil dikenakan biaya tambahan. Jam kerja pengemudi 07.00-23.59.</p>',
      isActive: true,
      sortOrder: 1,
      coverImg: '/images/haybali/alphard.png',
    },
    {
      name: 'Sewa Innova Zenix Bali',
      slug: 'sewa-innova-zenix-bali',
      category: 'CAR_RENTAL',
      destination: 'Bali',
      duration: '12 Jam',
      priceAdult: 850000,
      priceChild: 0,
      discount: 0,
      maxSlot: 3,
      minPax: 1,
      itinerary: JSON.stringify([
        { day: 1, title: 'Sewa Innova Zenix + Driver', description: 'Kapasitas 5-6 penumpang. Termasuk supir berpengalaman & BBM. Kabin modern dan nyaman. Perjalanan 12 jam, area standar (Kota/Bali Selatan/Bali Tengah) — satu wilayah per hari.' },
      ]),
      includes: JSON.stringify(['Supir berpengalaman', 'BBM', 'Air mineral', 'Kabin modern', '12 jam pemakaian']),
      excludes: JSON.stringify(['Tiket masuk objek wisata', 'Parkir & tol', 'Area terpencil (biaya tambahan)']),
      terms: '<p>Harga untuk area standar. Area terpencil dikenakan biaya tambahan. Jam kerja pengemudi 07.00-23.59.</p>',
      isActive: true,
      sortOrder: 2,
      coverImg: '/images/haybali/innova-zenix.png',
    },
    {
      name: 'Sewa Toyota HiAce Bali',
      slug: 'sewa-toyota-hiace-bali',
      category: 'CAR_RENTAL',
      destination: 'Bali',
      duration: '12 Jam',
      priceAdult: 1100000,
      priceChild: 0,
      discount: 0,
      maxSlot: 3,
      minPax: 1,
      itinerary: JSON.stringify([
        { day: 1, title: 'Sewa HiAce + Driver', description: 'Kapasitas 12-15 penumpang. Termasuk supir berpengalaman & BBM. Cocok untuk rombongan/event. Perjalanan 12 jam, area standar (Kota/Bali Selatan/Bali Tengah) — satu wilayah per hari.' },
      ]),
      includes: JSON.stringify(['Supir berpengalaman', 'BBM', 'Air mineral', 'Kapasitas rombongan', '12 jam pemakaian']),
      excludes: JSON.stringify(['Tiket masuk objek wisata', 'Parkir & tol', 'Area terpencil (biaya tambahan)']),
      terms: '<p>Harga untuk area standar. Area terpencil dikenakan biaya tambahan. Jam kerja pengemudi 07.00-23.59.</p>',
      isActive: true,
      sortOrder: 3,
      coverImg: '/images/haybali/hiace.png',
    },
    // --- Paket Tour Bali (harga per orang, placeholder — edit via admin) ---
    {
      name: 'Kintamani Tour',
      slug: 'kintamani-tour',
      category: 'PRIVATE_TRIP',
      destination: 'Bali',
      duration: '1 Hari',
      priceAdult: 750000,
      priceChild: 500000,
      discount: 0,
      maxSlot: 15,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Kintamani & Bedugul', description: 'Nikmati panorama Gunung Batur & Danau Batur dari Kintamani, dilanjutkan ke Pura Ulun Danu Beratan, Wanagiri Hidden Hills, dan Desa Penglipuran.' },
      ]),
      includes: JSON.stringify(['Mobil Private + Driver', 'BBM', 'Makan Siang View Gunung', 'Tiket Masuk Objek Wisata']),
      excludes: JSON.stringify(['Pengeluaran pribadi', 'Tips driver']),
      terms: '<p>Minimal pemesanan 2 orang. Harga per orang.</p>',
      isActive: true,
      sortOrder: 4,
      coverImg: '/images/haybali/kintamani-daytour.png',
    },
    {
      name: 'Ubud Tour',
      slug: 'ubud-tour',
      category: 'PRIVATE_TRIP',
      destination: 'Bali',
      duration: '1 Hari',
      priceAdult: 650000,
      priceChild: 450000,
      discount: 0,
      maxSlot: 15,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Jantung Budaya Bali', description: 'Jelajahi Sawah Terasering Tegallalang, Monkey Forest, Pura Tirta Empul, dan pasar seni Ubud.' },
      ]),
      includes: JSON.stringify(['Mobil Private + Driver', 'BBM', 'Makan Siang', 'Tiket Masuk Objek Wisata']),
      excludes: JSON.stringify(['Pengeluaran pribadi', 'Tips driver']),
      terms: '<p>Minimal pemesanan 2 orang. Harga per orang.</p>',
      isActive: true,
      sortOrder: 5,
      coverImg: '/images/haybali/ubud-daytour.png',
    },
    {
      name: 'Uluwatu Tour',
      slug: 'uluwatu-tour',
      category: 'PRIVATE_TRIP',
      destination: 'Bali',
      duration: '1 Hari',
      priceAdult: 550000,
      priceChild: 400000,
      discount: 0,
      maxSlot: 15,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Sunset Uluwatu', description: 'Saksikan matahari terbenam di Pura Uluwatu di tebing karang, kunjungi Pantai Padang-Padang, Pantai Bingin, dan pertunjukan Tari Kecak (opsional).' },
      ]),
      includes: JSON.stringify(['Mobil Private + Driver', 'BBM', 'Tiket Masuk', 'Tari Kecak (opsional)']),
      excludes: JSON.stringify(['Makan siang', 'Pengeluaran pribadi']),
      terms: '<p>Minimal pemesanan 2 orang. Harga per orang.</p>',
      isActive: true,
      sortOrder: 6,
      coverImg: '/images/haybali/uluwatu-daytour.png',
    },
    {
      name: 'Nusa Penida Tour',
      slug: 'nusa-penida-tour',
      category: 'PRIVATE_TRIP',
      destination: 'Bali',
      duration: '1 Hari',
      priceAdult: 850000,
      priceChild: 600000,
      discount: 0,
      maxSlot: 15,
      minPax: 2,
      itinerary: JSON.stringify([
        { day: 1, title: 'Petualangan Pulau Eksotis', description: 'Kelingking Beach, Broken Beach, Angel\'s Billabong, dan Crystal Bay. Termasuk tiket fastboat pulang-pergi.' },
      ]),
      includes: JSON.stringify(['Tiket Fastboat PP', 'Mobil Private + Driver', 'Makan Siang', 'Tiket Masuk Objek Wisata']),
      excludes: JSON.stringify(['Pengeluaran pribadi', 'Tips driver']),
      terms: '<p>Minimal pemesanan 2 orang. Harga per orang.</p>',
      isActive: true,
      sortOrder: 7,
      coverImg: '/images/haybali/nusapenida-daytour.png',
    },
    // --- Antar-Jemput Bandara (harga dihitung dari tabel tarif area) ---
    {
      name: 'Antar-Jemput Bandara Ngurah Rai',
      slug: 'antar-jemput-bandara-bali',
      category: 'AIRPORT_TRANSFER',
      destination: 'Bali',
      duration: 'Sekali Antar / Jemput',
      priceAdult: 150000,
      priceChild: 0,
      discount: 0,
      maxSlot: 50,
      minPax: 1,
      itinerary: JSON.stringify([
        { day: 1, title: 'Layanan 24/7', description: 'Penjemputan dan pengantaran tepat waktu. Driver kami siap menyambut Anda langsung di area kedatangan bandara. Harga final mengikuti tabel tarif berdasarkan area tujuan dan jumlah penumpang (1-5 / 6-10 orang).' },
      ]),
      includes: JSON.stringify(['Driver profesional', 'Penjemputan tepat waktu', 'Bantuan bagasi']),
      excludes: JSON.stringify(['Parkir bandara', 'Tol (bila ada)']),
      terms: '<p>Harga dapat berubah sewaktu-waktu. Konfirmasi harga akhir via WhatsApp.</p>',
      isActive: true,
      sortOrder: 8,
      coverImg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    },
  ];

  for (const product of haybaliProducts) {
    await prisma.tour.upsert({
      where: { slug: product.slug },
      update: { isActive: product.isActive },
      create: product,
    });
    console.log('HAYBALI product created:', product.name);
  }

  // Create sample destinations (mock data with real internet images)
  const destinations = [
    {
      name: 'Bali',
      slug: 'bali',
      shortDescription: 'Pulau Dewata dengan keindahan alam, budaya, dan pantai eksotis yang mendunia.',
      description: `<h2>Pesona Pulau Dewata</h2><p>Bali adalah destinasi wisata paling terkenal di Indonesia. Dikenal sebagai Pulau Dewata, Bali menawarkan kombinasi sempurna antara keindahan alam, kekayaan budaya, dan keramahan penduduk lokal.</p><p>Dari persawahan hijau di Ubud, ombak menantang di Uluwatu, hingga kehidupan malam yang semarak di Seminyak, Bali memiliki sesuatu untuk setiap pelancong.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pura Tanah Lot saat sunset</li><li>Tegallalang Rice Terrace di Ubud</li><li>Pantai Pandawa dan Nusa Dua</li><li>Monkey Forest Ubud</li><li>Pura Uluwatu dengan Tari Kecak</li></ul><h3>Tips Berkunjung</h3><p>Sewa motor adalah cara terbaik menjelajahi Bali. Hormati adat istiadat setempat, terutama saat memasuki area pura. Bawa pakaian sopan untuk kunjungan ke tempat suci.</p>`,
      location: 'Bali, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
        'https://images.unsplash.com/photo-1544644181-1484b3f4f62c?w=800',
        'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800',
        'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800',
      ]),
      rating: 4.8,
      reviewCount: 1256,
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Snorkeling', 'Surfing', 'Trekking', 'Kunjungan Pura', 'Diving', 'Yoga & Wellness', 'Sunset Cruise']),
      highlight: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Raja Ampat',
      slug: 'raja-ampat',
      shortDescription: 'Surga bawah laut terbaik dunia dengan keanekaragaman hayati laut paling kaya di planet ini.',
      description: `<h2>Permata Tersembunyi di Timur Indonesia</h2><p>Raja Ampat di Papua Barat adalah destinasi diving dan snorkeling terbaik di dunia. Dengan lebih dari 1.500 spesies ikan dan 600 jenis karang keras, Raja Ampat adalah pusat keanekaragaman hayati laut dunia.</p><p>Kepulauan ini terdiri dari empat pulau utama — Waigeo, Batanta, Salawati, dan Misool — serta ratusan pulau kecil dan gugusan karst yang menakjubkan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pianemo (Mini Wayag) — bukit dengan pemandangan gugusan karst</li><li>Wayag Island — ikon Raja Ampat dari ketinggian</li><li>Pasir Timbul — gugusan pasir yang muncul saat surut</li><li>Desa Arborek — desa wisata dengan kerajinan khas</li><li>Manta Point — spot untuk melihat pari manta</li></ul><h3>Tips Berkunjung</h3><p>Waktu terbaik adalah Oktober hingga April. Bawa sunscreen reef-safe. Sinyal terbatas, jadi nikmati detoks digital Anda sepenuhnya.</p>`,
      location: 'Papua Barat, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1589330273594-fade1ee916af?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1589330273594-fade1ee916af?w=800',
        'https://images.unsplash.com/photo-1598928506311-c55e2e1af26e?w=800',
        'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800',
        'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=800',
      ]),
      rating: 4.9,
      reviewCount: 987,
      bestTimeToVisit: 'Oktober - April',
      activities: JSON.stringify(['Diving', 'Snorkeling', 'Bird Watching', 'Island Hopping', 'Fotografi', 'Kayaking']),
      highlight: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Yogyakarta',
      slug: 'yogyakarta',
      shortDescription: 'Kota budaya dengan warisan kerajaan, candi kuno, dan kuliner legendaris yang tak tertandingi.',
      description: `<h2>Jantung Budaya Jawa</h2><p>Yogyakarta, atau yang akrab disebut Jogja, adalah pusat kebudayaan Jawa yang kaya akan sejarah, tradisi, dan keramahan. Kota ini adalah perpaduan sempurna antara warisan masa lalu dan kehidupan modern yang dinamis.</p><p>Dari kemegahan Candi Borobudur dan Prambanan hingga hiruk-pikuk Malioboro yang legendaris, Jogja menawarkan pengalaman yang tak terlupakan bagi setiap wisatawan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Candi Borobudur — candi Budha terbesar di dunia</li><li>Candi Prambanan — kompleks candi Hindu yang megah</li><li>Keraton Yogyakarta — istana Sultan yang masih berfungsi</li><li>Taman Sari — bekas taman kerajaan dengan arsitektur unik</li><li>Malioboro — pusat perbelanjaan dan kuliner khas</li></ul><h3>Kuliner Khas</h3><p>Gudeg, bakpia pathok, sate klatak, dan wedang ronde adalah beberapa kuliner yang wajib Anda cicipi. Jangan lupa mencoba kopi joss — kopi tubruk dengan arang panas!</p>`,
      location: 'Yogyakarta, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1559801423-5f1e7f0c0e1b?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1559801423-5f1e7f0c0e1b?w=800',
        'https://images.unsplash.com/photo-1596462506358-e2f09b62a3a1?w=800',
        'https://images.unsplash.com/photo-1537955261031-f294e92c8571?w=800',
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
      ]),
      rating: 4.7,
      reviewCount: 2103,
      bestTimeToVisit: 'Mei - September',
      activities: JSON.stringify(['Wisata Candi', 'Wisata Kuliner', 'Belanja', 'Jeep Merapi', 'Seni & Budaya', 'Gua Pindul']),
      highlight: true,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Lombok',
      slug: 'lombok',
      shortDescription: 'Pulau seribu masjid dengan pantai eksotis, Gunung Rinjani, dan Gili yang memukau.',
      description: `<h2>Keindahan yang Belum Tersentuh</h2><p>Lombok sering disebut sebagai adik Bali yang lebih tenang. Pulau ini menawarkan pantai-pantai yang masih alami, gunung berapi yang megah, dan tiga gili yang terkenal di seluruh dunia — Gili Trawangan, Gili Meno, dan Gili Air.</p><p>Dibandingkan tetangganya yang lebih terkenal, Lombok memberikan pengalaman yang lebih otentik dengan harga yang lebih terjangkau.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Gunung Rinjani — gunung berapi kedua tertinggi di Indonesia</li><li>Gili Trawangan — pusat kehidupan malam dan diving</li><li>Gili Meno — surga romantis yang tenang</li><li>Pantai Pink — salah satu dari sedikit pantai berpasir pink di dunia</li><li>Air Terjun Tiu Kelep — air terjun spektakuler di kaki Rinjani</li></ul><h3>Tips Berkunjung</h3><p>Sewa perahu untuk island hopping ke tiga Gili. Untuk pendakian Rinjani, persiapkan fisik minimal 2 minggu sebelumnya. Musim hujan (November-Maret) sebaiknya dihindari untuk pendakian.</p>`,
      location: 'Nusa Tenggara Barat, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1572901764362-914b99d60e19?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1572901764362-914b99d60e19?w=800',
        'https://images.unsplash.com/photo-1544644181-1484b3f4f62c?w=800',
        'https://images.unsplash.com/photo-1523343885641-43c6c94e59ba?w=800',
      ]),
      rating: 4.6,
      reviewCount: 1567,
      bestTimeToVisit: 'Mei - September',
      activities: JSON.stringify(['Pendakian', 'Snorkeling', 'Diving', 'Island Hopping', 'Surfing', 'Camping']),
      highlight: false,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Labuan Bajo',
      slug: 'labuan-bajo',
      shortDescription: 'Gerbang menuju Taman Nasional Komodo dengan panorama pulau dan laut yang memukau.',
      description: `<h2>Gerbang Menuju Surga Timur</h2><p>Labuan Bajo di Flores, Nusa Tenggara Timur, adalah gerbang menuju Taman Nasional Komodo — salah satu dari 7 Keajaiban Dunia Baru. Kawasan ini terkenal dengan komodo purba, pantai merah muda, dan gugusan pulau-pulau indah yang memukau mata.</p><p>Dari atas Bukit Cinta, Anda akan disuguhi panorama matahari terbenam yang tak terlukiskan — salah satu sunset terbaik di Indonesia. Padar Island dengan tiga teluk berwarna berbeda adalah spot foto yang ikonik.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pulau Komodo — habitat asli komodo purba</li><li>Pulau Padar — panorama tiga teluk ikonik</li><li>Pink Beach — pantai pasir merah muda yang langka</li><li>Pulau Kelor — snorkeling dengan air sebening kristal</li><li>Gua Rangko — kolam alami di dalam gua stalaktit</li></ul><h3>Tips Berkunjung</h3><p>Gunakan liveaboard atau speed boat untuk menjelajahi pulau-pulau. Selalu ikuti instruksi ranger saat bertemu komodo. Bawa obat anti mabuk laut jika Anda sensitif terhadap ombak.</p>`,
      location: 'Nusa Tenggara Timur, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
        'https://images.unsplash.com/photo-1591531892578-761f37336e71?w=800',
        'https://images.unsplash.com/photo-1544644181-1484b3f4f62c?w=800',
        'https://images.unsplash.com/photo-1598928506311-c55e2e1af26e?w=800',
      ]),
      rating: 4.8,
      reviewCount: 1890,
      bestTimeToVisit: 'April - November',
      activities: JSON.stringify(['Trekking Komodo', 'Snorkeling', 'Diving', 'Island Hopping', 'Fotografi', 'Cave Exploration']),
      highlight: true,
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'Bromo',
      slug: 'bromo',
      shortDescription: 'Gunung berapi ikonik dengan sunrise spektakuler dan lautan pasir yang magis.',
      description: `<h2>Keajaiban Alam di Jawa Timur</h2><p>Gunung Bromo di Taman Nasional Bromo Tengger Semeru adalah salah satu destinasi paling ikonik di Indonesia. Panorama matahari terbit dari Bukit Penanjakan dengan latar belakang Gunung Bromo, Batok, dan Semeru adalah pemandangan yang wajib disaksikan setidaknya sekali seumur hidup.</p><p>Lautan pasir yang luas, kawah yang masih aktif mengeluarkan asap, dan budaya Suku Tengger yang unik menjadikan kawasan ini destinasi yang tak terlupakan. Setiap tahun, Upacara Kasada atau Yadnya Kasada menjadi daya tarik budaya tersendiri.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Penanjakan 1 — spot sunrise terbaik</li><li>Kawah Bromo — mendekati bibir kawah aktif</li><li>Pasir Berbisik — hamparan pasir vulkanik luas</li><li>Bukit Teletubbies — perbukitan hijau kontras</li><li>Pura Luhur Poten — pura Suku Tengger</li></ul><h3>Tips Berkunjung</h3><p>Bawa jaket tebal karena suhu bisa mencapai 5°C di pagi hari. Waktu terbaik adalah musim kemarau (Mei-September). Gunakan masker saat di sekitar kawah.</p>`,
      location: 'Jawa Timur, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      ]),
      rating: 4.7,
      reviewCount: 3201,
      bestTimeToVisit: 'Mei - September',
      activities: JSON.stringify(['Trekking', 'Fotografi', 'Jeep Adventure', 'Camping', 'Wisata Budaya']),
      highlight: false,
      isActive: true,
      sortOrder: 6,
    },
    {
      name: 'Danau Toba',
      slug: 'danau-toba',
      shortDescription: 'Danau vulkanik terbesar di dunia dengan Pulau Samosir di tengahnya.',
      description: `<h2>Danau Vulkanik Terbesar di Dunia</h2><p>Danau Toba di Sumatera Utara adalah danau vulkanik terbesar di dunia yang terbentuk dari letusan supervulkan sekitar 74.000 tahun lalu. Di tengahnya terdapat Pulau Samosir — pulau di dalam pulau — yang menyimpan kekayaan budaya Batak yang sangat khas.</p><p>Keindahan alam Danau Toba kini semakin mudah diakses dengan hadirnya Bandara Silangit dan jalan tol yang menghubungkan Medan ke kawasan danau. Desa-desa tradisional seperti Tomok dan Ambarita menawarkan pengalaman budaya yang autentik.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Bukit Indah Simarjarunjung — panorama danau dari ketinggian</li><li>Air Terjun Sipiso-piso — air terjun tertinggi di Indonesia</li><li>Desa Tomok — makam Raja Sidabutar</li><li>Batu Kursi Persidangan di Ambarita</li><li>Bukit Holbung — perbukitan hijau dengan pemandangan danau</li></ul><h3>Kuliner Khas</h3><p>Ikan mas arsik, naniura (sashimi Batak), dan saksang adalah hidangan yang wajib dicoba. Kopi Sidikalang adalah oleh-oleh yang sempurna.</p>`,
      location: 'Sumatera Utara, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1558547519-ad38e0ef36b3?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1558547519-ad38e0ef36b3?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1559801423-5f1e7f0c0e1b?w=800',
      ]),
      rating: 4.5,
      reviewCount: 1432,
      bestTimeToVisit: 'Mei - September',
      activities: JSON.stringify(['Wisata Alam', 'Wisata Budaya', 'Bersepeda', 'Berenang', 'Fotografi', 'Wisata Kuliner']),
      highlight: false,
      isActive: true,
      sortOrder: 7,
    },
    {
      name: 'Wakatobi',
      slug: 'wakatobi',
      shortDescription: 'Taman nasional laut dengan terumbu karang terindah dan diving kelas dunia.',
      description: `<h2>Underwater Paradise</h2><p>Taman Nasional Wakatobi di Sulawesi Tenggara adalah salah satu destinasi diving dan snorkeling terbaik di dunia. Nama Wakatobi sendiri diambil dari empat pulau utama — Wangi-Wangi, Kaledupa, Tomia, dan Binongko.</p><p>Dengan lebih dari 750 spesies karang dan 942 spesies ikan, Wakatobi memiliki biodiversitas laut yang luar biasa. Jacques Cousteau pernah menyebut kawasan ini sebagai "surga bawah laut" pada tahun 1990-an, dan julukan itu masih relevan hingga kini.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Hoga Island — spot diving terbaik dengan karang lunak</li><li>Tomia Wall — dinding karang vertikal spektakuler</li><li>Pulau Anano — pantai pasir putih sempurna</li><li>Sombu Dive — spot untuk melihat penyu dan hiu karang</li><li>Bajo Village — desa suku Bajo yang hidup di atas laut</li></ul><h3>Tips Berkunjung</h3><p>Sertifikasi diving sangat direkomendasikan. Waktu terbaik adalah Maret hingga Desember. Bawa perlengkapan diving sendiri jika punya karena rental terbatas. Hormati konservasi — jangan menyentuh karang.</p>`,
      location: 'Sulawesi Tenggara, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        'https://images.unsplash.com/photo-1589330273594-fade1ee916af?w=800',
        'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800',
      ]),
      rating: 4.8,
      reviewCount: 756,
      bestTimeToVisit: 'Maret - Desember',
      activities: JSON.stringify(['Diving', 'Snorkeling', 'Island Hopping', 'Fotografi Bawah Air', 'Kayaking', 'Wisata Desa']),
      highlight: false,
      isActive: true,
      sortOrder: 8,
    },
    {
      name: 'Banda Neira',
      slug: 'banda-neira',
      shortDescription: 'Kepulauan rempah dengan sejarah kolonial dan diving spot kelas dunia.',
      description: `<h2>Kepulauan Rempah yang Penuh Sejarah</h2><p>Banda Neira di Maluku adalah kepulauan kecil yang menyimpan sejarah besar. Pada abad ke-16 hingga 17, Kepulauan Banda adalah satu-satunya sumber pala di dunia, yang membuatnya menjadi rebutan bangsa Eropa — terutama Belanda dan Inggris.</p><p>Saat ini, Banda Neira menawarkan wisata sejarah kolonial yang sangat terawat, diving di spot kelas dunia, serta keramahan penduduk lokal yang akan membuat Anda merasa seperti di rumah sendiri.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Benteng Belgica — benteng pentagon peninggalan Belanda</li><li>Istana Mini — rumah pengasingan Bung Hatta</li><li>Gunung Api Banda — gunung berapi yang bisa didaki</li><li>Lava Flow Dive Site — diving di aliran lava bawah laut</li><li>Hatta Island — pulau kecil dengan snorkeling spektakuler</li></ul><h3>Tips Berkunjung</h3><p>Akses ke Banda Neira masih terbatas — pesawat kecil dari Ambon atau kapal. Waktu terbaik adalah Maret-Mei dan September-November. Bawa uang tunai cukup karena tidak ada ATM di pulau.</p>`,
      location: 'Maluku, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800',
        'https://images.unsplash.com/photo-1598928506311-c55e2e1af26e?w=800',
        'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=800',
      ]),
      rating: 4.6,
      reviewCount: 342,
      bestTimeToVisit: 'Maret - Mei, September - November',
      activities: JSON.stringify(['Diving', 'Snorkeling', 'Wisata Sejarah', 'Pendakian', 'Fotografi', 'Wisata Rempah']),
      highlight: false,
      isActive: true,
      sortOrder: 9,
    },
    {
      name: 'Belitung',
      slug: 'belitung',
      shortDescription: 'Pantai pasir putih dengan batu granit raksasa, air sebening kristal, dan suasana tropis yang tenang.',
      description: `<h2>Maldives-nya Indonesia</h2><p>Belitung, atau Belitong, adalah pulau di lepas pantai timur Sumatera yang terkenal dengan pantai-pantai pasir putihnya yang dihiasi batu granit raksasa. Air lautnya yang jernih kebiruan dan tenang membuatnya sering dijuluki sebagai "Maldives-nya Indonesia".</p><p>Pulau ini menjadi terkenal secara nasional setelah menjadi latar film Laskar Pelangi pada tahun 2008. Kini Belitung adalah destinasi wisata yang lengkap — pantai indah, kuliner seafood segar, dan budaya Melayu yang khas.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pantai Tanjung Tinggi — batu granit raksasa ikonik</li><li>Pulau Lengkuas — mercusuar kolonial Belanda</li><li>Pantai Tanjung Kelayang — spot snorkeling terbaik</li><li>Kaolin Lake — danau biru bekas tambang kaolin</li><li>Kampung Laskar Pelangi — replika sekolah di film</li></ul><h3>Kuliner Khas</h3><p>Mie Belitung (mie kuah dengan seafood), gangan (sup ikan kepala), dan kopi kong djie adalah menu yang harus dicoba. Belitung juga terkenal dengan kerupuk ikan dan getan.</p>`,
      location: 'Bangka Belitung, Indonesia',
      imageUrl: 'https://images.unsplash.com/photo-1513415756790-2ac1db1297d0?w=1200',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1513415756790-2ac1db1297d0?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1558547519-ad38e0ef36b3?w=800',
      ]),
      rating: 4.5,
      reviewCount: 1089,
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Island Hopping', 'Snorkeling', 'Fotografi', 'Wisata Kuliner', 'Bersepeda Pantai', 'Sunset Cruise']),
      highlight: false,
      isActive: true,
      sortOrder: 10,
    },
  ];

  // HAYBALI rebrand: destinasi nasional lama tidak dipakai lagi.
  // Yang sudah ada dinonaktifkan, yang belum ada tidak dibuat ulang.
  for (const dest of destinations) {
    const existing = await prisma.destination.findUnique({ where: { slug: dest.slug } });
    if (existing) {
      await prisma.destination.update({ where: { slug: dest.slug }, data: { ...dest, isActive: false } });
      console.log('Destination deactivated:', dest.name);
    } else {
      console.log('Destination skipped (legacy):', dest.name);
    }
  }

  // 4 destinasi HAYBALI TRANS yang aktif
  const haybaliDestinations = [
    {
      name: 'Kintamani',
      slug: 'kintamani',
      shortDescription: 'Dataran tinggi dengan panorama Gunung Batur dan Danau Batur yang menakjubkan.',
      description: '<h2>Panorama Gunung & Danau Batur</h2><p>Kintamani adalah dataran tinggi di Bali tengah yang menyajikan pemandangan Gunung Batur dan Danau Batur dari ketinggian. Udara sejuknya menjadikan kawasan ini favorit untuk makan siang sambil menikmati panorama.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Penelokan Viewpoint</li><li>Gunung Batur</li><li>Desa Trunyan</li><li>Pemandian Air Panas Toya Devasya</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/kintamani.png',
      gallery: JSON.stringify(['/images/haybali/kintamani.png', '/images/haybali/bedugul.png']),
      rating: 4.8,
      reviewCount: 120,
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Trekking', 'Fotografi', 'Air Panas', 'Wisata Desa']),
      highlight: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Ubud',
      slug: 'ubud',
      shortDescription: 'Jantung budaya Bali dengan sawah terasering, seni, dan suasana villa yang menenangkan.',
      description: '<h2>Jantung Budaya Bali</h2><p>Ubud adalah pusat seni dan spiritual Bali. Dikelilingi sawah terasering hijau dan hutan tropis, Ubud menawarkan pengalaman yang menenangkan — yoga, spa, galeri seni, dan kuliner sehat.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Tegallalang Rice Terrace</li><li>Monkey Forest Ubud</li><li>Pura Tirta Empul</li><li>Pasar Seni Ubud</li><li>Campuhan Ridge Walk</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/ubud.png',
      gallery: JSON.stringify(['/images/haybali/ubud.png', '/images/haybali/honeymoon-ubud.png']),
      rating: 4.9,
      reviewCount: 150,
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Wisata Budaya', 'Spa & Yoga', 'Fotografi', 'Wisata Kuliner', 'Bersepeda']),
      highlight: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Uluwatu',
      slug: 'uluwatu',
      shortDescription: 'Tebing karang megah, pantai surfing legendaris, dan sunset Tari Kecak yang memukau.',
      description: '<h2>Tebing Karang & Sunset Legendaris</h2><p>Uluwatu di ujung selatan Bali adalah rumah bagi Pura Luhur Uluwatu yang bertengger di tebing setinggi 70 meter. Setiap sore, pertunjukan Tari Kecak dengan latar matahari terbenam menjadi momen yang tak terlupakan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Pura Luhur Uluwatu</li><li>Pantai Padang-Padang</li><li>Pantai Bingin</li><li>Pantai Melasti</li><li>Suluban Beach</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/bali-roundtrip.png',
      gallery: JSON.stringify(['/images/haybali/bali-roundtrip.png', '/images/haybali/uluwatu-beach.png']),
      rating: 4.7,
      reviewCount: 90,
      bestTimeToVisit: 'April - Oktober',
      activities: JSON.stringify(['Surfing', 'Tari Kecak', 'Fotografi Sunset', 'Beach Club']),
      highlight: true,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Nusa Penida',
      slug: 'nusa-penida',
      shortDescription: 'Pulau eksotis dengan tebing dramatis, pantai tersembunyi, dan snorkeling kelas dunia.',
      description: '<h2>Petualangan Pulau Eksotis</h2><p>Nusa Penida adalah pulau di tenggara Bali yang terkenal dengan Kelingking Beach — tebing berbentuk T-Rex yang ikonik. Pulau ini juga menawarkan snorkeling bersama manta dan pantai-pantai tersembunyi yang menakjubkan.</p><h3>Yang Wajib Dikunjungi</h3><ul><li>Kelingking Beach</li><li>Angel\'s Billabong & Broken Beach</li><li>Crystal Bay</li><li>Manta Point</li><li>Diamond Beach</li></ul>',
      location: 'Bali, Indonesia',
      imageUrl: '/images/haybali/nusa-penida.png',
      gallery: JSON.stringify(['/images/haybali/nusa-penida.png', '/images/haybali/nusa-penida-bay.png']),
      rating: 4.9,
      reviewCount: 130,
      bestTimeToVisit: 'April - November',
      activities: JSON.stringify(['Snorkeling', 'Fotografi', 'Island Hopping', 'Trekking Ringan']),
      highlight: true,
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const dest of haybaliDestinations) {
    const existing = await prisma.destination.findUnique({ where: { slug: dest.slug } });
    if (existing) {
      await prisma.destination.update({ where: { slug: dest.slug }, data: dest });
      console.log('Destination updated:', dest.name);
    } else {
      await prisma.destination.create({ data: dest });
      console.log('Destination created:', dest.name);
    }
  }

  // Create some sample reviews (for seeded data purposes, we'd need orders too)
  // This is just for display - in production these come from real bookings
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
