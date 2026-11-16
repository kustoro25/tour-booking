// Bersihkan seluruh data paket tour, destinasi, dan blog dari database.
// Perusahaan hanya menyediakan layanan sewa mobil (CAR_RENTAL), sehingga
// produk kategori lain (OPEN_TRIP, PRIVATE_TRIP, HONEYMOON, dst) dihapus.
//
// Jalankan: node scripts/purge-tour-data.cjs --dry   (lihat rencana)
//           node scripts/purge-tour-data.cjs         (eksekusi)
require('dotenv').config({ path: ['.env.local', '.env'] });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const DRY = process.argv.includes('--dry');

const KEEP_CATEGORIES = ['CAR_RENTAL'];
const REMOVED_PAGE_SLUGS = ['blog', 'destinations', 'destinations-cta', 'tours', 'home-destinations', 'home-tours'];

const ABOUT = {
  label: 'Tentang',
  heading: 'Tentang Kami',
  storyTitle: 'Cerita Kami',
  story: 'HAYBALI TRANS adalah mitra sewa mobil dengan supir tepercaya di Bali yang berkomitmen memberikan pengalaman perjalanan yang nyaman, aman, dan berkelas melalui pelayanan VIP, harga transparan, serta armada yang prima.\n\nKami menyediakan beragam pilihan armada — dari MPV keluarga hingga luxury MPV — lengkap dengan supir berpengalaman yang siap mengantar Anda ke seluruh penjuru Bali. Semua tarif sudah termasuk supir dan BBM tanpa batasan jarak tempuh.\n\nKami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merawat setiap unit dan melatih setiap pengemudi dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.',
  vision: 'Menjadi penyedia jasa sewa mobil dengan supir paling tepercaya di Bali dengan pelayanan VIP yang konsisten.',
  mission: [
    'Menyediakan armada bersih, wangi, dan terawat',
    'Memberikan pelayanan supir profesional dan ramah',
    'Harga transparan tanpa biaya tersembunyi',
    'Mempermudah proses booking dengan teknologi modern',
    'Mendukung pariwisata dan komunitas lokal Bali',
  ],
  whyUs: [
    { icon: '🚙', title: 'Armada Prima', desc: 'Kendaraan bersih, wangi, dan terawat untuk kenyamanan Anda.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '👨‍✈️', title: 'Supir Profesional', desc: 'Berpengalaman, ramah, dan siap melayani sesuai jam layanan kami.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-gold-400/10 text-gold-200' },
    { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung pariwisata dan masyarakat lokal Bali.', color: 'bg-gold-400/10 text-gold-200' },
  ],
};

const TERMS_HTML = `<h2>1. Umum</h2>
<p>Dengan menggunakan layanan HAYBALI TRANS ("Kami"), Anda ("Tamu" atau "Pelanggan") dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</p>

<h2>2. Pemesanan (Booking)</h2>
<ul><li>Booking dianggap sah apabila tamu telah menyelesaikan formulir pemesanan dan menerima nomor invoice.</li>
<li>Tamu wajib mengisi data diri, tanggal, jam penjemputan, dan area tujuan dengan lengkap dan benar.</li>
<li>Ketersediaan armada bersifat real-time dan dikonfirmasi saat booking.</li></ul>

<h2>3. Pembayaran</h2>
<ul><li>Pemesanan memerlukan deposit 50% untuk mengunci jadwal dan pengemudi.</li>
<li>Pelunasan dilakukan sebelum atau saat perjalanan sesuai kesepakatan.</li>
<li>Batas pembayaran 24 jam sejak invoice diterbitkan. Jika tidak dibayar, pesanan otomatis dibatalkan.</li>
<li>Metode pembayaran mengikuti informasi yang tercantum pada invoice.</li></ul>

<h2>4. Pembatalan</h2>
<p>Pembatalan sebaiknya dikonfirmasi minimal 3 jam sebelum jadwal penjemputan. Bila pembatalan dilakukan kurang dari waktu tersebut, mohon dimaklumi bahwa DP yang telah dibayarkan tidak dapat dikembalikan karena jadwal dan pengemudi telah kami kunci untuk Anda.</p>

<h2>5. Perubahan Jadwal</h2>
<ul><li>Permintaan perubahan tanggal atau jam penjemputan mengikuti ketersediaan armada.</li>
<li>Perubahan sebaiknya dikonfirmasi minimal 3 jam sebelum jadwal semula.</li>
<li>Biaya tambahan dikenakan bila perubahan menyebabkan penyesuaian tarif.</li></ul>

<h2>6. Jam Kerja & Biaya Tambahan Pengemudi</h2>
<ul><li>Jam kerja pengemudi 07.00–23.59 WITA.</li>
<li>Penjemputan 07.00–10.30 tanpa biaya tambahan; di luar jam tersebut dikenakan Rp 50.000/mobil.</li>
<li>Lewat tengah malam dikenakan Rp 150.000/jam; menginap di luar kota Rp 350.000/malam.</li>
<li>Area di luar area standar dikenakan biaya tambahan sesuai tabel remote area.</li></ul>

<h2>7. Tanggung Jawab</h2>
<ul><li>Kami bertanggung jawab menyediakan armada dan pengemudi sesuai pesanan.</li>
<li>Kami tidak bertanggung jawab atas force majeure (bencana alam, penutupan jalan, kerusuhan, dan sejenisnya).</li>
<li>Tamu bertanggung jawab atas barang bawaan pribadi.</li></ul>

<h2>8. Perubahan Ketentuan</h2>
<p>Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan berlaku efektif sejak dipublikasikan di website.</p>

<h2>9. Hubungi Kami</h2>
<p>Jika ada pertanyaan, hubungi kami melalui halaman Hubungi Kami atau email support@haybalitrans.com.</p>`;

const PRIVACY_HTML = `<h2>1. Informasi yang Kami Kumpulkan</h2>
<p>Saat Anda menggunakan layanan HAYBALI TRANS, kami dapat mengumpulkan informasi berikut:</p>
<ul><li><strong>Data Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, dan informasi kontak lainnya yang Anda berikan saat booking.</li>
<li><strong>Data Pemesanan:</strong> Jenis armada, tanggal dan jam penjemputan, area tujuan, serta preferensi khusus.</li>
<li><strong>Data Pembayaran:</strong> Informasi pembayaran diproses melalui bank atau payment gateway pihak ketiga. Kami tidak menyimpan data kartu kredit atau kredensial perbankan Anda.</li>
<li><strong>Data Teknis:</strong> Alamat IP, tipe browser, sistem operasi, dan halaman yang dikunjungi untuk keperluan analitik.</li></ul>

<h2>2. Penggunaan Informasi</h2>
<ul><li>Memproses pemesanan dan pembayaran Anda.</li>
<li>Mengirimkan invoice, e-ticket, dan konfirmasi pemesanan.</li>
<li>Memberikan informasi tentang perubahan jadwal penjemputan.</li>
<li>Mengirimkan permintaan review setelah perjalanan selesai.</li>
<li>Meningkatkan kualitas layanan dan pengalaman pengguna website.</li>
<li>Mengirimkan informasi promosi dan penawaran khusus (dengan persetujuan Anda).</li></ul>

<h2>3. Perlindungan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan teknis dan organisasional untuk melindungi data pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran. Ini termasuk enkripsi data, firewall, dan kontrol akses yang ketat.</p>

<h2>4. Berbagi Data dengan Pihak Ketiga</h2>
<ul><li><strong>Penyedia Pembayaran:</strong> Data pembayaran diproses oleh bank atau payment gateway sesuai kebijakan privasi masing-masing.</li>
<li><strong>Pengemudi:</strong> Nama dan detail penjemputan dibagikan kepada pengemudi untuk keperluan operasional.</li>
<li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum atau perintah pengadilan yang sah.</li></ul>

<h2>5. Cookie</h2>
<p>Website kami menggunakan cookie untuk mengingat preferensi Anda, analisis trafik website, dan menjaga sesi login admin.</p>

<h2>6. Penyimpanan Data</h2>
<p>Kami menyimpan data pribadi Anda selama diperlukan untuk tujuan pengumpulannya, atau sesuai ketentuan hukum yang berlaku. Data pemesanan disimpan minimal 5 tahun untuk keperluan akuntansi dan pajak.</p>

<h2>7. Hak Anda</h2>
<ul><li>Hak untuk mengakses data pribadi Anda.</li>
<li>Hak untuk mengoreksi data yang tidak akurat.</li>
<li>Hak untuk meminta penghapusan data (right to be forgotten).</li>
<li>Hak untuk menarik persetujuan pemrosesan data kapan saja.</li>
<li>Hak untuk mengajukan keluhan ke otoritas perlindungan data.</li></ul>

<h2>8. Perubahan Kebijakan Privasi</h2>
<p>Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan diumumkan melalui website dan, untuk perubahan signifikan, melalui email.</p>

<h2>9. Hubungi Kami</h2>
<p>Jika Anda memiliki pertanyaan terkait Kebijakan Privasi ini, hubungi kami melalui halaman Hubungi Kami atau email privacy@haybalitrans.com.</p>`;

async function main() {
  const tourPackages = await p.tour.findMany({
    where: { category: { notIn: KEEP_CATEGORIES } },
    select: { id: true, slug: true, name: true, category: true },
  });
  const tourIds = tourPackages.map((t) => t.id);
  const orders = tourIds.length
    ? await p.order.findMany({ where: { tourId: { in: tourIds } }, select: { id: true, invoiceNo: true, status: true } })
    : [];

  console.log(`\n=== RENCANA PEMBERSIHAN ${DRY ? '(DRY RUN)' : ''} ===`);
  console.log(`Produk paket tour dihapus : ${tourPackages.length}`);
  tourPackages.forEach((t) => console.log(`   - [${t.category}] ${t.slug} | ${t.name}`));
  console.log(`Order terkait dihapus     : ${orders.length}`);
  orders.forEach((o) => console.log(`   - ${o.invoiceNo} (${o.status})`));
  console.log(`Destinasi                 : ${await p.destination.count()}`);
  console.log(`Blog                      : ${await p.blog.count()}`);
  console.log(`Halaman CMS dihapus       : ${REMOVED_PAGE_SLUGS.join(', ')}`);
  console.log('Halaman CMS diperbarui    : about, footer, testimonials, privacy, terms');

  if (DRY) {
    console.log('\nDry run selesai. Tidak ada data yang diubah.');
    return;
  }

  const orderIds = orders.map((o) => o.id);
  const planIds = orderIds.length
    ? (await p.installmentPlan.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((pl) => pl.id)
    : [];

  await p.$transaction(
    async (tx) => {
      if (planIds.length) {
        await tx.installmentPayment.deleteMany({ where: { planId: { in: planIds } } });
        await tx.installmentPlan.deleteMany({ where: { id: { in: planIds } } });
      }
      if (orderIds.length) {
        await tx.review.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.invoice.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      if (tourIds.length) {
        await tx.review.deleteMany({ where: { tourId: { in: tourIds } } });
        await tx.tourSlot.deleteMany({ where: { tourId: { in: tourIds } } });
        await tx.galleryImage.deleteMany({ where: { tourId: { in: tourIds } } });
        await tx.tour.deleteMany({ where: { id: { in: tourIds } } });
      }
      await tx.tour.updateMany({ where: { destinationId: { not: null } }, data: { destinationId: null } });
      await tx.destination.deleteMany({});
      await tx.blog.deleteMany({});
      await tx.page.deleteMany({ where: { slug: { in: REMOVED_PAGE_SLUGS } } });
    },
    { timeout: 120000, maxWait: 20000 }
  );

  // Perbarui konten halaman CMS agar tidak lagi menyebut paket tour
  const about = await p.page.findUnique({ where: { slug: 'about' } });
  if (about) await p.page.update({ where: { slug: 'about' }, data: { content: JSON.stringify(ABOUT) } });

  const footer = await p.page.findUnique({ where: { slug: 'footer' } });
  if (footer) {
    const prev = JSON.parse(footer.content || '{}');
    await p.page.update({
      where: { slug: 'footer' },
      data: {
        content: JSON.stringify({
          ...prev,
          text: 'Mitra sewa mobil dan transportasi privat tepercaya di Bali. Mengutamakan keselamatan, kenyamanan, dan pelayanan VIP bagi seluruh pelanggan.',
          copyright: `© 2022 HAYBALI TRANS. All rights reserved.`,
        }),
      },
    });
  }

  const testimonials = await p.page.findUnique({ where: { slug: 'testimonials' } });
  if (testimonials) {
    const prev = JSON.parse(testimonials.content || '{}');
    await p.page.update({
      where: { slug: 'testimonials' },
      data: {
        content: JSON.stringify({
          ...prev,
          heading: 'Cerita dari Mereka yang Telah Bepergian',
          subheading: 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan perjalanan nyaman dengan armada dan supir HAYBALI TRANS.',
        }),
      },
    });
  }

  for (const [slug, html] of [['terms', TERMS_HTML], ['privacy', PRIVACY_HTML]]) {
    const row = await p.page.findUnique({ where: { slug } });
    if (row) await p.page.update({ where: { slug }, data: { content: JSON.stringify({ html }) } });
  }

  console.log('\nSelesai. Data paket tour, destinasi, dan blog telah dihapus.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
