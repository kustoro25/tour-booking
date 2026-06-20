'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import ImageUpload from '@/components/ui/ImageUpload';
import { useAdminRole } from '@/lib/useAdminRole';

// ─── Data schemas per page type ───

interface FaqItem { question: string; answer: string; }
interface StatItem { num: string; label: string; }
interface ValueItem { icon: string; title: string; desc: string; color: string; }

type PageData = {
  // home-hero
  tagline?: string;
  heading?: string;
  headingHighlight?: string;
  headingAfter?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  cta2Text?: string;
  cta2Link?: string;
  stats?: StatItem[];
  bgImage?: string;
  // home-value
  valueHeading?: string;
  valueSubheading?: string;
  valueItems?: ValueItem[];
  // home-faq
  faqs?: FaqItem[];
  // privacy / terms
  html?: string;
  // about
  storyTitle?: string;
  story?: string;
  vision?: string;
  mission?: string[];
  whyUs?: { icon: string; title: string; desc: string; color: string }[];
  // contact
  infoCards?: { icon: string; title: string; detail: string; color: string }[];
  // gallery
  label?: string;
  // destinations page
  highlightTitle?: string;
  allTitle?: string;
  // footer
  helpLink?: string;
  text?: string;
  copyright?: string;
  socialLinks?: { platform: string; url: string; icon: string }[];
  // generic fallback
  body?: string;
  [key: string]: string | number | boolean | object | undefined | null | string[] | Record<string, unknown>[];
};

const defaultData: Record<string, PageData> = {
  'home-hero': {
    tagline: '🔥 Ribuan wisatawan telah berangkat bersama kami',
    heading: 'Jelajahi Destinasi',
    headingHighlight: 'Impian',
    headingAfter: 'Anda Tanpa Ribet!',
    subheading: 'Paket tour terbaik dengan pelayanan premium, harga transparan, dan sistem booking instan. Pilih jadwalmu, amankan kursimu, dan bersiaplah untuk petualangan tak terlupakan.',
    ctaText: '🚀 Lihat Paket Wisata',
    ctaLink: '/tours',
    cta2Text: 'Booking Sekarang',
    cta2Link: '/contact',
    stats: [
      { num: '5000+', label: 'Wisatawan' },
      { num: '50+', label: 'Destinasi' },
      { num: '4.9', label: 'Rating ★' },
    ],
    bgImage: '/images/hero.png',
  },
  'home-value': {
    valueHeading: 'Mengapa Memilih Kami?',
    valueSubheading: 'Kami hadir untuk memberikan pengalaman booking tour terbaik dengan standar pelayanan premium.',
    valueItems: [
      { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Apa yang Anda lihat, itulah yang Anda bayar.', color: 'from-green-500 to-emerald-600' },
      { icon: '⚡', title: 'Booking Instan', desc: '3 langkah, 1 menit. Invoice langsung terbit dan masuk ke email Anda.', color: 'from-blue-500 to-blue-600' },
      { icon: '🎯', title: 'Guide Profesional', desc: 'Tim guide kami berpengalaman dan bersertifikat resmi.', color: 'from-purple-500 to-purple-600' },
      { icon: '🛡️', title: 'Garansi Keberangkatan', desc: 'Jadwal pasti berangkat sesuai kuota minimum yang realistis.', color: 'from-orange-500 to-orange-600' },
    ],
  },
  'home-faq': {
    label: 'Bantuan',
    heading: 'Pertanyaan yang Sering Diajukan',
    subheading: 'Temukan jawaban untuk pertanyaan-pertanyaan umum seputar pemesanan, pembayaran, dan perjalanan tour bersama Jelajah Nusantara.',
    faqs: [
      { question: 'Bagaimana cara melakukan booking?', answer: 'Caranya sangat mudah! Pilih paket tour yang Anda inginkan, tentukan tanggal keberangkatan dari kalender interaktif, isi data diri dan jumlah peserta, lalu klik "Booking Sekarang". Invoice akan langsung terbit dan dikirim ke email Anda.' },
      { question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami menerima transfer bank (BCA, Mandiri, BRI, BNI) dan e-wallet (OVO, Dana, GoPay, ShopeePay). Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika melebihi batas waktu, pesanan akan otomatis dibatalkan.' },
      { question: 'Bagaimana kebijakan pembatalan dan refund?', answer: 'Pembatalan H-14: refund 80%. H-7: refund 50%. H-3: refund 25%. Kurang dari H-3: tidak ada refund. Jika tour dibatalkan oleh kami karena force majeure atau kuota minimal tidak terpenuhi, Anda mendapat refund 100%.' },
      { question: 'Apakah ada minimal peserta untuk setiap tour?', answer: 'Ya, setiap paket tour memiliki minimal peserta (umumnya 2 orang). Informasi ini tercantum di halaman detail masing-masing paket. Jika kuota minimal tidak terpenuhi, tim kami akan menghubungi Anda untuk opsi alternatif.' },
    ],
  },
  'privacy': {
    html: `<h2>1. Informasi yang Kami Kumpulkan</h2>
<p>Saat Anda menggunakan layanan Jelajah Nusantara Tour, kami dapat mengumpulkan informasi berikut:</p>
<ul><li><strong>Data Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, dan informasi kontak lainnya yang Anda berikan saat booking.</li>
<li><strong>Data Pemesanan:</strong> Detail paket tour yang dipesan, tanggal perjalanan, jumlah peserta, dan preferensi khusus.</li>
<li><strong>Data Pembayaran:</strong> Informasi pembayaran diproses melalui payment gateway pihak ketiga. Kami tidak menyimpan data kartu kredit atau kredensial perbankan Anda.</li>
<li><strong>Data Teknis:</strong> Alamat IP, tipe browser, sistem operasi, dan halaman yang dikunjungi untuk keperluan analitik.</li></ul>

<h2>2. Penggunaan Informasi</h2>
<p>Informasi yang kami kumpulkan digunakan untuk:</p>
<ul><li>Memproses pemesanan dan pembayaran Anda.</li>
<li>Mengirimkan invoice, e-ticket, dan konfirmasi pemesanan.</li>
<li>Memberikan informasi tentang perubahan jadwal atau pembaruan tour.</li>
<li>Mengirimkan permintaan review setelah tour selesai.</li>
<li>Meningkatkan kualitas layanan dan pengalaman pengguna website.</li>
<li>Mengirimkan informasi promosi dan penawaran khusus (dengan persetujuan Anda).</li></ul>

<h2>3. Perlindungan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang memadai untuk melindungi data pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran. Ini termasuk enkripsi data, firewall, dan kontrol akses yang ketat.</p>

<h2>4. Berbagi Data dengan Pihak Ketiga</h2>
<p>Kami tidak menjual, memperdagangkan, atau menyewakan data pribadi Anda kepada pihak ketiga. Kami dapat membagikan data Anda dalam kondisi berikut:</p>
<ul><li><strong>Payment Gateway:</strong> Data pembayaran diproses oleh Midtrans/Xendit sesuai kebijakan privasi mereka.</li>
<li><strong>Partner Tour:</strong> Data peserta (nama) dibagikan kepada guide dan operator tour untuk keperluan operasional.</li>
<li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum atau perintah pengadilan yang sah.</li></ul>

<h2>5. Cookie</h2>
<p>Website kami menggunakan cookie untuk meningkatkan pengalaman browsing Anda. Cookie adalah file kecil yang disimpan di perangkat Anda. Kami menggunakan cookie untuk: mengingat preferensi Anda, analisis trafik website, dan menjaga sesi login admin.</p>

<h2>6. Penyimpanan Data</h2>
<p>Kami menyimpan data pribadi Anda selama diperlukan untuk tujuan pengumpulannya, atau sesuai dengan ketentuan hukum yang berlaku. Data pemesanan disimpan minimal 5 tahun untuk keperluan akuntansi dan pajak.</p>

<h2>7. Hak Anda</h2>
<ul><li>Hak untuk mengakses data pribadi Anda.</li>
<li>Hak untuk mengoreksi data yang tidak akurat.</li>
<li>Hak untuk meminta penghapusan data (right to be forgotten).</li>
<li>Hak untuk menarik persetujuan pemrosesan data kapan saja.</li>
<li>Hak untuk mengajukan keluhan ke otoritas perlindungan data.</li></ul>

<h2>8. Perubahan Kebijakan Privasi</h2>
<p>Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan akan diumumkan melalui website dan, untuk perubahan signifikan, kami akan mengirimkan pemberitahuan melalui email.</p>

<h2>9. Hubungi Kami</h2>
<p>Jika Anda memiliki pertanyaan terkait Kebijakan Privasi ini, silakan hubungi kami melalui halaman Hubungi Kami atau kirim email ke privacy@jelajahnusantara.com.</p>`
  },
  'terms': {
    html: `<h2>1. Umum</h2>
<p>Dengan menggunakan layanan Jelajah Nusantara Tour ("Kami"), Anda ("Tamu" atau "Pelanggan") dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</p>

<h2>2. Pemesanan (Booking)</h2>
<ul><li>Booking dianggap sah apabila tamu telah menyelesaikan form pemesanan dan menerima nomor invoice.</li>
<li>Tamu wajib mengisi data diri dengan lengkap dan benar.</li>
<li>Setiap booking bersifat mengikat dan tidak dapat dipindahtangankan.</li>
<li>Ketersediaan slot bersifat real-time.</li></ul>

<h2>3. Pembayaran</h2>
<ul><li>Pembayaran harus dilakukan dalam waktu 24 jam sejak invoice diterbitkan.</li>
<li>Pembayaran dapat dilakukan melalui transfer bank atau e-wallet yang tercantum di invoice.</li>
<li>Jika pembayaran tidak diterima dalam batas waktu, pesanan akan otomatis dibatalkan.</li>
<li>Semua harga sudah termasuk pajak dan biaya layanan.</li></ul>

<h2>4. Pembatalan & Refund</h2>
<table><tr><th>Waktu Pembatalan</th><th>Refund</th></tr>
<tr><td>H-14 atau lebih</td><td>80%</td></tr>
<tr><td>H-7 sampai H-13</td><td>50%</td></tr>
<tr><td>H-3 sampai H-6</td><td>25%</td></tr>
<tr><td>Kurang dari H-3</td><td>Tidak ada refund</td></tr></table>
<p>Refund diproses dalam 7-14 hari kerja.</p>

<h2>5. Perubahan Jadwal</h2>
<ul><li>Permintaan perubahan tanggal maksimal H-7 sebelum keberangkatan.</li>
<li>Perubahan tanggal bergantung pada ketersediaan slot.</li>
<li>Biaya tambahan mungkin dikenakan jika harga di tanggal baru berbeda.</li></ul>

<h2>6. Tanggung Jawab</h2>
<ul><li>Kami bertanggung jawab atas pelaksanaan tour sesuai itinerary.</li>
<li>Kami tidak bertanggung jawab atas force majeure.</li>
<li>Tamu bertanggung jawab atas barang bawaan pribadi.</li>
<li>Kami menyarankan tamu memiliki asuransi perjalanan.</li></ul>

<h2>7. Kode Etik Tamu</h2>
<ul><li>Tamu wajib menghormati budaya dan adat setempat.</li>
<li>Kami berhak mengeluarkan tamu tanpa refund jika melanggar kode etik.</li></ul>

<h2>8. Perubahan Ketentuan</h2>
<p>Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan berlaku efektif sejak publikasi.</p>

<h2>9. Hubungi Kami</h2>
<p>Jika ada pertanyaan, hubungi kami melalui halaman Hubungi Kami atau email support@jelajahnusantara.com.</p>`
  },
  'about': {
    label: 'Tentang',
    heading: 'Tentang Kami',
    storyTitle: 'Cerita Kami',
    story: 'Jelajah Nusantara Tour adalah perusahaan jasa perjalanan wisata yang berkomitmen memberikan pengalaman liburan tak terlupakan dengan pelayanan personal dan harga transparan.\n\nBerdiri sejak 2018, kami telah melayani ribuan wisatawan domestik dan mancanegara dengan paket-paket tour pilihan ke destinasi terbaik di Indonesia. Dari Bali hingga Raja Ampat, dari Bromo hingga Danau Toba — kami ada untuk mewujudkan liburan impian Anda.\n\nKami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merancang setiap paket tour dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.',
    vision: 'Menjadi platform booking tour yang paling mudah, transparan, dan terpercaya bagi wisatawan domestik maupun mancanegara.',
    mission: [
      'Menyediakan paket tour berkualitas dengan harga transparan',
      'Memberikan pelayanan personal dan profesional',
      'Mempermudah proses booking dengan teknologi modern',
      'Mendukung pariwisata lokal dan komunitas setempat',
    ],
    whyUs: [
      { icon: '🎯', title: 'Guide Profesional', desc: 'Tim guide kami berpengalaman, bersertifikat, dan ramah.', color: 'bg-blue-50 text-blue-600' },
      { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-green-50 text-green-600' },
      { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-purple-50 text-purple-600' },
      { icon: '🔄', title: 'Fleksibel', desc: 'Jadwal private trip yang bisa disesuaikan.', color: 'bg-teal-50 text-teal-600' },
      { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-orange-50 text-orange-600' },
      { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung ekowisata dan pemberdayaan masyarakat lokal.', color: 'bg-emerald-50 text-emerald-600' },
    ],
  },
  'contact': {
    label: 'Kontak',
    heading: 'Hubungi Kami',
    subheading: 'Punya pertanyaan atau butuh bantuan memilih paket? Tim kami siap membantu!',
    infoCards: [
      { icon: '📞', title: 'WhatsApp', detail: '+62 812-3456-7890', color: 'from-green-500 to-green-600' },
      { icon: '📧', title: 'Email', detail: 'info@jelajahnusantara.com', color: 'from-blue-500 to-blue-600' },
      { icon: '🕐', title: 'Jam Operasional', detail: 'Senin – Jumat, 09.00 – 18.00 WIB', color: 'from-purple-500 to-purple-600' },
      { icon: '📍', title: 'Alamat', detail: 'Jl. Pariwisata No. 123, Jakarta Selatan', color: 'from-orange-500 to-orange-600' },
    ],
  },
  'destinations': {
    label: 'Jelajahi',
    heading: 'Destinasi Wisata',
    subheading: 'Temukan destinasi impian Anda di seluruh penjuru Nusantara. Dari pantai eksotis hingga pegunungan megah — semua ada di sini.',
    highlightTitle: 'Destinasi Unggulan',
    allTitle: 'Semua Destinasi',
  },
  'destinations-cta': {
    label: 'Destinasi Detail',
    heading: 'Siap Berpetualang?',
    subheading: 'Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!',
    ctaText: 'Lihat Paket Tour',
    ctaLink: '/tours',
  },
  'tours': {
    label: 'Koleksi Kami',
    heading: 'Paket Wisata',
    subheading: 'Jelajahi berbagai pilihan paket tour ke destinasi terbaik di Indonesia',
  },
  'blog': {
    label: 'Blog & Tips',
    heading: 'Tips Traveling & Inspirasi Wisata',
    subheading: 'Panduan lengkap untuk liburan hemat, destinasi tersembunyi, dan tips traveling dari para ahli.',
  },
  'testimonials': {
    label: 'Testimoni',
    heading: 'Cerita dari Mereka yang Telah Berpetualang',
    subheading: 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan serunya liburan tanpa beban bersama Jelajah Nusantara.',
    ctaText: 'Lihat Semua Testimoni',
    ctaLink: '/testimonials',
  },
  'footer': {
    text: 'Platform booking tour terpercaya untuk menjelajahi destinasi terbaik di Indonesia. Harga transparan, booking instan, dan guide profesional.',
    copyright: `© ${new Date().getFullYear()} Jelajah Nusantara Tour. All rights reserved.`,
    socialLinks: [
      { platform: 'WhatsApp', url: 'https://wa.me/6281234567890', icon: 'whatsapp' },
      { platform: 'Instagram', url: 'https://instagram.com/jelajahnusantara', icon: 'instagram' },
      { platform: 'Email', url: 'mailto:info@jelajahnusantara.com', icon: 'email' },
    ],
  },
  'invoice-premium': {
    companyTagline: 'Perjalanan Anda, Prioritas Kami',
    headerBg: '#1a1a1a',
    headerBgEnd: '#1a1a1a',
    headerTextColor: '#ffffff',
    accentColor: '#e59800',
    borderColor: '#333333',
    headingBilledTo: 'Invoice to:',
    headingInvoiceDetails: 'Detail Invoice',
    headingOrderSummary: 'Ringkasan Pesanan',
    headingPriceBreakdown: 'Rincian Biaya',
    headingPaymentInfo: 'Informasi Pembayaran',
    headingDeadline: 'Batas Pembayaran',
    headingTerms: 'Syarat & Ketentuan',
    deadlineText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan.',
    termsText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.',
    paymentInstructionsText: 'Silakan lakukan transfer ke salah satu rekening bank di bawah ini. Pastikan jumlah yang ditransfer sesuai dengan total invoice. Setelah transfer, konfirmasi akan dikirim otomatis ke email Anda.',
    footerText: 'Terima kasih telah memilih {nama} sebagai mitra perjalanan Anda. E-Ticket akan dikirim ke email Anda setelah pembayaran terkonfirmasi. Untuk bantuan, hubungi {phone} atau {email}.',
    labelInvoiceNo: 'Invoice#',
    labelInvoiceDate: 'Tanggal',
    labelPaymentDeadline: 'Batas Pembayaran',
    labelPublishedDate: 'Diterbitkan:',
    labelTourDate: 'Tanggal Perjalanan',
    labelDuration: 'Durasi',
    labelAdults: 'Dewasa',
    labelChildren: 'Anak',
    labelPricePerAdult: 'Harga / Dewasa',
    labelPricePerChild: 'Harga / Anak',
    labelDiscount: 'Diskon',
    labelSubTotal: 'Sub Total',
    labelTax: 'Tax',
    labelTotal: 'Total',
    labelBank: 'Bank',
    labelAccountName: 'a.n.',
    labelSignature: 'Authorised Sign',
    signatureImage: '',
    stampImage: '',
    showStamp: false,
    helpLink: '/contact',
    showSignature: true,
    showDeadline: true,
    showTerms: true,
    statusBadges: {
      PENDING: { bg: '#2d1f00', text: '#f59e0b', border: '#78350f', dot: '#f59e0b', icon: '⏳' },
      CONFIRMED: { bg: '#052e16', text: '#22c55e', border: '#166534', dot: '#22c55e', icon: '✅' },
      COMPLETED: { bg: '#0c1929', text: '#3b82f6', border: '#1e3a5f', dot: '#3b82f6', icon: '🏁' },
      CANCELLED: { bg: '#2d0d0d', text: '#ef4444', border: '#7f1d1d', dot: '#ef4444', icon: '❌' },
    },
  },
  'invoice-custom': {
    headerBg: '#1e3a5f',
    headerBgEnd: '#0f172a',
    headerTextColor: '#ffffff',
    accentColor: '#f59e0b',
    borderColor: '#e2e8f0',
    headingBilledTo: 'Ditagihkan Kepada',
    headingInvoiceDetails: 'Detail Invoice',
    headingOrderSummary: 'Ringkasan Pesanan',
    headingPriceBreakdown: 'Rincian Biaya',
    headingPaymentInfo: 'Informasi Pembayaran',
    headingDeadline: 'Batas Pembayaran',
    headingTerms: 'Syarat & Ketentuan',
    deadlineText: 'Mohon selesaikan pembayaran sebelum {{date}}. Jika melewati batas waktu, pesanan akan otomatis dibatalkan.',
    termsText: 'Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan. E-Ticket akan dikirim setelah pembayaran terkonfirmasi. Tidak ada pengembalian dana untuk pembatalan mendadak.',
    footerText: 'Terima kasih telah memilih {nama} sebagai mitra perjalanan Anda. E-Ticket akan dikirim ke email Anda setelah pembayaran terkonfirmasi. Untuk bantuan, hubungi {phone} atau {email}.',
    labelInvoiceNo: 'Nomor Invoice',
    labelInvoiceDate: 'Tanggal Invoice',
    labelPaymentDeadline: 'Batas Pembayaran',
    labelPublishedDate: 'Diterbitkan:',
    labelTourDate: 'Tgl. Perjalanan',
    labelDuration: 'Durasi',
    labelAdults: 'Dewasa',
    labelChildren: 'Anak',
    labelDiscount: 'Diskon',
    labelSubTotal: 'Sub Total',
    labelTax: 'Tax',
    labelTotal: 'TOTAL',
    labelBank: 'Bank',
    labelAccountName: 'a.n.',
    labelSignature: 'Authorised Sign',
    helpLink: '/contact',
    showSignature: false,
    showDeadline: true,
    showTerms: false,
    statusBadges: {
      PENDING: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', dot: '#f59e0b', icon: '⏳' },
      CONFIRMED: { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7', dot: '#10b981', icon: '✅' },
      COMPLETED: { bg: '#f0f9ff', text: '#0369a1', border: '#7dd3fc', dot: '#0ea5e9', icon: '🏁' },
      CANCELLED: { bg: '#fff1f2', text: '#be123c', border: '#fda4af', dot: '#f43f5e', icon: '❌' },
    },
  },
  'home-cta': {
    heading: 'Siap untuk Petualangan Berikutnya?',
    subheading: 'Pilih paket tour favorit Anda dan booking dalam hitungan menit. Mudah, cepat, dan transparan.',
    ctaText: 'Jelajahi Paket Tour',
    ctaLink: '/tours',
    cta2Text: 'Hubungi Kami',
    cta2Link: '/contact',
  },
  'home-gallery': {
    label: 'Jelajah Visual',
    heading: 'Sekilas Keindahan Nusantara',
    subheading: 'Dari sabana luas di timur hingga pantai eksotis di barat — lihat sendiri pesona destinasi impianmu.',
  },
  'home-tours': {
    label: 'Paket Pilihan',
    heading: 'Paket Wisata Unggulan',
    subheading: 'Temukan paket tour terbaik kami ke destinasi paling menakjubkan di Indonesia',
    ctaText: 'Lihat Semua Paket Wisata',
    ctaLink: '/tours',
  },
  'home-destinations': {
    label: 'Eksplorasi',
    heading: 'Destinasi Impian, Satu Klik Saja',
    subheading: 'Dari pantai eksotis berpasir putih hingga puncak gunung megah berselimut kabut — setiap sudut Nusantara menyimpan cerita yang menunggu untuk kamu buka.',
    ctaText: 'Lihat Semua Destinasi',
    ctaLink: '/destinations',
  },
};

export default function AdminPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { isSuperAdmin } = useAdminRole();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [data, setData] = useState<PageData>({});

  const isHero = slug === 'home-hero';
  const isValue = slug === 'home-value';
  const isFaq = slug === 'home-faq';
  const isHtml = slug === 'privacy' || slug === 'terms';
  const isAbout = slug === 'about';
  const isContact = slug === 'contact';
  const isTestimonials = slug === 'testimonials';
  const isFooter = slug === 'footer';
  const isCta = slug === 'home-cta';
  const isGallery = slug === 'home-gallery';
  const isTours = slug === 'home-tours';
  const isDestinations = slug === 'home-destinations';
  const isDestinationsPage = slug === 'destinations';
  const isDestinationsCta = slug === 'destinations-cta';
  const isToursPage = slug === 'tours';
  const isBlog = slug === 'blog';
  const isInvoicePremium = slug === 'invoice-premium';
  const isGeneric = !isHero && !isValue && !isFaq && !isHtml && !isAbout && !isContact && !isTestimonials && !isFooter && !isCta && !isGallery && !isTours && !isDestinations && !isDestinationsPage && !isDestinationsCta && !isToursPage && !isBlog && !isInvoicePremium;

  useEffect(() => { fetchPage(); }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`);
      const d = await res.json();
      if (d.success) {
        setTitle(d.data.title);
        try {
          const parsed = JSON.parse(d.data.content);
          setData({ ...defaultData[slug], ...parsed });
        } catch { setData(defaultData[slug] || {}); }
      } else {
        setTitle(slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
        setData(defaultData[slug] || {});
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const update = (key: string, value: string | number | boolean | object | null | undefined | string[] | Record<string, unknown>[]) => setData({ ...data, [key]: value });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setShowBlocked(true);
      setTimeout(() => setShowBlocked(false), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: JSON.stringify(data) }),
      });
      const d = await res.json();
      if (d.success) {
        showToast('Halaman berhasil disimpan!', 'success');
        setTimeout(() => router.push('/admin/pages'), 800);
      } else {
        showToast(d.error || 'Gagal menyimpan', 'error');
      }
    } catch { showToast('Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6"><Skeleton className="h-6 w-32 mb-3" /><Skeleton className="h-10 w-full" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Halaman</h1>
          <p className="text-sm text-gray-500 mt-1">Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{slug}</code></p>
        </div>
        <Link href="/admin/pages" className="text-sm text-blue-600 hover:text-blue-700">← Kembali</Link>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── Title ── */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Halaman</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
        </div>

        {/* ═══════════ HOME - HERO ═══════════ */}
        {isHero && (
          <>
            <SectionCard icon="🏷️" title="Tagline">
              <input type="text" value={data.tagline || ''} onChange={e => update('tagline', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="🔥 Ribuan wisatawan telah berangkat bersama kami" />
            </SectionCard>

            <SectionCard icon="📝" title="Heading Utama">
              <p className="text-xs text-gray-400 mb-3">Heading ditampilkan dalam tiga bagian: teks awal (bold), kata yang disorot (oranye), dan teks akhir.</p>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="text-xs font-semibold text-amber-700 mb-1.5 block uppercase tracking-wide">① Teks Awal (Bold)</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                    placeholder="Jelajahi Destinasi" />
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-300">
                  <label className="text-xs font-semibold text-orange-700 mb-1.5 block uppercase tracking-wide">② Highlight (Oranye)</label>
                  <input type="text" value={data.headingHighlight || ''} onChange={e => update('headingHighlight', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                    placeholder="Impian" />
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="text-xs font-semibold text-blue-700 mb-1.5 block uppercase tracking-wide">③ Teks Akhir</label>
                  <input type="text" value={data.headingAfter || ''} onChange={e => update('headingAfter', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    placeholder="Anda Tanpa Ribet!" />
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Pratinjau Hasil:</p>
                <p className="text-base"><strong>{data.heading || 'Jelajahi Destinasi'}</strong> <span className="text-orange-500 font-bold">{data.headingHighlight || 'Impian'}</span> {data.headingAfter || 'Anda Tanpa Ribet!'}</p>
              </div>
            </SectionCard>

            <SectionCard icon="💬" title="Subheading / Deskripsi">
              <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Deskripsi di bawah heading..." />
            </SectionCard>

            <SectionCard icon="🔗" title="Tombol CTA">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tombol 1 (oranye)</label>
                  <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                    placeholder="🚀 Lihat Paket Wisata" />
                  <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="/tours" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tombol 2 (outline putih)</label>
                  <input type="text" value={data.cta2Text || ''} onChange={e => update('cta2Text', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                    placeholder="Booking Sekarang" />
                  <input type="text" value={data.cta2Link || ''} onChange={e => update('cta2Link', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="/contact" />
                </div>
              </div>
            </SectionCard>

            <SectionCard icon="📊" title="Statistik (Trust Badges)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(data.stats || []).map((s, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-xs text-gray-500">#{i + 1}</label>
                    <input type="text" value={s.num} onChange={e => {
                      const st = [...(data.stats || [])]; st[i] = { ...st[i], num: e.target.value }; update('stats', st);
                    }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5000+" />
                    <input type="text" value={s.label} onChange={e2 => {
                      const st = [...(data.stats || [])]; st[i] = { ...st[i], label: e2.target.value }; update('stats', st);
                    }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Wisatawan" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon="🖼️" title="Background">
              <ImageUpload value={data.bgImage || ''} onChange={url => update('bgImage', url)} label="URL Background" folder="tour-booking/cms" />
            </SectionCard>
          </>
        )}

        {/* ═══════════ HOME - VALUE ═══════════ */}
        {isValue && (
          <>
            <SectionCard icon="📝" title="Heading">
              <input type="text" value={data.valueHeading || ''} onChange={e => update('valueHeading', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3" />
              <textarea value={data.valueSubheading || ''} onChange={e => update('valueSubheading', e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </SectionCard>
            <SectionCard icon="💎" title="Value Items (4 kartu)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(data.valueItems || []).map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                      <input type="text" value={item.icon} onChange={e => {
                        const it = [...(data.valueItems || [])]; it[i] = { ...it[i], icon: e.target.value }; update('valueItems', it);
                      }} className="w-8 text-center border rounded px-1 py-0.5 text-sm" placeholder="💰" />
                    </div>
                    <input type="text" value={item.title} onChange={e => {
                      const it = [...(data.valueItems || [])]; it[i] = { ...it[i], title: e.target.value }; update('valueItems', it);
                    }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Harga Transparan" />
                    <textarea value={item.desc} onChange={e => {
                      const it = [...(data.valueItems || [])]; it[i] = { ...it[i], desc: e.target.value }; update('valueItems', it);
                    }} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ HOME - FAQ ═══════════ */}
        {isFaq && (
          <>
            <SectionCard icon="📝" title="Header FAQ">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Bantuan" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Pertanyaan yang Sering Diajukan" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Temukan jawaban untuk pertanyaan-pertanyaan umum..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="❓" title="Daftar FAQ" addLabel="+ Tambah Pertanyaan" onAdd={() => update('faqs', [...(data.faqs || []), { question: '', answer: '' }])}>
            <div className="space-y-4">
              {(data.faqs || []).map((faq, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Pertanyaan #{i + 1}</span>
                    {(data.faqs || []).length > 1 && (
                      <button type="button" onClick={() => update('faqs', (data.faqs || []).filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs">✕ Hapus</button>
                    )}
                  </div>
                  <input type="text" value={faq.question} onChange={e => {
                    const f = [...(data.faqs || [])]; f[i] = { ...f[i], question: e.target.value }; update('faqs', f);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Pertanyaan..." />
                  <textarea value={faq.answer} onChange={e => {
                    const f = [...(data.faqs || [])]; f[i] = { ...f[i], answer: e.target.value }; update('faqs', f);
                  }} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jawaban..." />
                </div>
              ))}
            </div>
          </SectionCard>
          </>
        )}

        {/* ═══════════ HTML (privacy, terms) ═══════════ */}
        {isHtml && (
          <SectionCard icon="📄" title="Konten HTML">
            <p className="text-xs text-gray-400 mb-3">Gunakan HTML: <code>&lt;h2&gt;</code> untuk judul, <code>&lt;p&gt;</code> untuk paragraf.</p>
            <textarea value={data.html || ''} onChange={e => update('html', e.target.value)} rows={20}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" spellCheck={false} />
          </SectionCard>
        )}

        {/* ═══════════ ABOUT ═══════════ */}
        {isAbout && (
          <>
            <SectionCard icon="📝" title="Header Halaman">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Tentang" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading Halaman</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Tentang Kami" />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="📖" title="Cerita Kami">
              <input type="text" value={data.storyTitle || ''} onChange={e => update('storyTitle', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3" placeholder="Judul section" />
              <textarea value={data.story || ''} onChange={e => update('story', e.target.value)} rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cerita perusahaan..." />
            </SectionCard>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SectionCard icon="🎯" title="Visi">
                <textarea value={data.vision || ''} onChange={e => update('vision', e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </SectionCard>
              <SectionCard icon="🚀" title="Misi">
                <div className="space-y-2">
                  {(data.mission as string[] || []).map((m: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-teal-500 mt-2 flex-shrink-0">✓</span>
                      <input type="text" value={m} onChange={e => {
                        const arr = [...(data.mission as string[] || [])]; arr[i] = e.target.value; update('mission', arr);
                      }} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      {(data.mission as string[] || []).length > 1 && (
                        <button type="button" onClick={() => update('mission', (data.mission as string[]).filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => update('mission', [...(data.mission as string[] || []), ''])}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Tambah Misi</button>
                </div>
              </SectionCard>
            </div>
            <SectionCard icon="⭐" title="Mengapa Memilih Kami?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(data.whyUs as Array<{icon:string;title:string;desc:string;color:string}> || []).map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <input type="text" value={item.icon} onChange={e => {
                      const arr = [...(data.whyUs as Array<{icon:string;title:string;desc:string;color:string}> || [])]; arr[i] = { ...arr[i], icon: e.target.value }; update('whyUs', arr);
                    }} className="w-12 text-center border rounded px-1 py-0.5 text-sm" placeholder="🎯" />
                    <div className="flex-1 space-y-1">
                      <input type="text" value={item.title} onChange={e => {
                        const arr = [...(data.whyUs as Array<{icon:string;title:string;desc:string;color:string}> || [])]; arr[i] = { ...arr[i], title: e.target.value }; update('whyUs', arr);
                      }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Judul" />
                      <input type="text" value={item.desc} onChange={e => {
                        const arr = [...(data.whyUs as Array<{icon:string;title:string;desc:string;color:string}> || [])]; arr[i] = { ...arr[i], desc: e.target.value }; update('whyUs', arr);
                      }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Deskripsi" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ CONTACT ═══════════ */}
        {isContact && (
          <>
            <SectionCard icon="📝" title="Header Halaman">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Kontak" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Hubungi Kami" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Punya pertanyaan atau butuh bantuan..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="📞" title="Info Cards">
              <div className="space-y-3">
                {(data.infoCards as Array<{icon:string;title:string;detail:string;color:string}> || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <input type="text" value={item.icon} onChange={e => {
                      const arr = [...(data.infoCards as Array<{icon:string;title:string;detail:string;color:string}> || [])]; arr[i] = { ...arr[i], icon: e.target.value }; update('infoCards', arr);
                    }} className="w-12 text-center border rounded px-1 py-0.5 text-sm" placeholder="📞" />
                    <div className="flex-1 space-y-1">
                      <input type="text" value={item.title} onChange={e => {
                        const arr = [...(data.infoCards as Array<{icon:string;title:string;detail:string;color:string}> || [])]; arr[i] = { ...arr[i], title: e.target.value }; update('infoCards', arr);
                      }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="WhatsApp" />
                      <input type="text" value={item.detail} onChange={e => {
                        const arr = [...(data.infoCards as Array<{icon:string;title:string;detail:string;color:string}> || [])]; arr[i] = { ...arr[i], detail: e.target.value }; update('infoCards', arr);
                      }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="+62 812-3456-7890" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        {isTestimonials && (
          <>
            <SectionCard icon="💬" title="Header Testimoni">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Testimoni" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Cerita dari Mereka yang Telah Berpetualang" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Kepuasan Anda adalah kebahagiaan kami..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="🔗" title="Tombol Lihat Semua">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks tombol</label>
                <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  placeholder="Lihat Semua Testimoni" />
                <label className="text-xs text-gray-500 mb-1 block">Link tujuan</label>
                <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="/testimonials" />
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ FOOTER ═══════════ */}
        {isFooter && (
          <>
            <SectionCard icon="📄" title="Deskripsi">
              <textarea value={data.text || ''} onChange={e => update('text', e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Platform booking tour terpercaya..." />
            </SectionCard>
            <SectionCard icon="©️" title="Copyright">
              <input type="text" value={data.copyright || ''} onChange={e => update('copyright', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="© 2026 Jelajah Nusantara Tour. All rights reserved." />
            </SectionCard>
            <SectionCard icon="🔗" title="Social Media Links" addLabel="+ Tambah Medsos" onAdd={() => update('socialLinks', [...(data.socialLinks as Array<{platform:string;url:string;icon:string}> || []), { platform: '', url: '', icon: 'whatsapp' }])}>
              <div className="space-y-3">
                {(data.socialLinks as Array<{platform:string;url:string;icon:string}> || []).map((link, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <select value={link.icon} onChange={e => {
                      const arr = [...(data.socialLinks as Array<{platform:string;url:string;icon:string}> || [])]; arr[i] = { ...arr[i], icon: e.target.value }; update('socialLinks', arr);
                    }} className="w-28 border rounded-lg px-2 py-1.5 text-sm bg-white">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="email">Email</option>
                      <option value="globe">Website</option>
                    </select>
                    <input type="text" value={link.platform} onChange={e => {
                      const arr = [...(data.socialLinks as Array<{platform:string;url:string;icon:string}> || [])]; arr[i] = { ...arr[i], platform: e.target.value }; update('socialLinks', arr);
                    }} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="WhatsApp" />
                    <input type="text" value={link.url} onChange={e => {
                      const arr = [...(data.socialLinks as Array<{platform:string;url:string;icon:string}> || [])]; arr[i] = { ...arr[i], url: e.target.value }; update('socialLinks', arr);
                    }} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
                    {(data.socialLinks as Array<{platform:string;url:string;icon:string}> || []).length > 1 && (
                      <button type="button" onClick={() => update('socialLinks', (data.socialLinks as Array<{platform:string;url:string;icon:string}>).filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ HOME - CTA ═══════════ */}
        {isCta && (
          <>
            <SectionCard icon="📝" title="Heading & Subheading">
              <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                placeholder="Siap untuk Petualangan Berikutnya?" />
              <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Pilih paket tour favorit Anda..." />
            </SectionCard>
            <SectionCard icon="🔗" title="Tombol CTA">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tombol 1 (oranye)</label>
                  <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2" placeholder="Jelajahi Paket Tour" />
                  <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="/tours" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tombol 2 (outline putih)</label>
                  <input type="text" value={data.cta2Text || ''} onChange={e => update('cta2Text', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2" placeholder="Hubungi Kami" />
                  <input type="text" value={data.cta2Link || ''} onChange={e => update('cta2Link', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="/contact" />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ HOME - GALLERY ═══════════ */}
        {isGallery && (
          <SectionCard icon="🖼️" title="Jelajah Visual Section">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Jelajah Visual" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Sekilas Keindahan Nusantara" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Dari sabana luas di timur..." />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ═══════════ HOME - TOURS ═══════════ */}
        {isTours && (
          <>
            <SectionCard icon="🏝️" title="Paket Wisata Unggulan Section">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paket Pilihan" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paket Wisata Unggulan" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Temukan paket tour terbaik..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="🔗" title="Tombol Lihat Semua">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks tombol</label>
                <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  placeholder="Lihat Semua Paket Wisata" />
                <label className="text-xs text-gray-500 mb-1 block">Link tujuan</label>
                <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="/tours" />
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ HOME - DESTINATIONS ═══════════ */}
        {isDestinations && (
          <>
            <SectionCard icon="🗺️" title="Destinasi Impian Section">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Eksplorasi" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading (bagian pertama)</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Destinasi Impian," />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Dari pantai eksotis..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="🔗" title="Tombol Lihat Semua">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks tombol</label>
                <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  placeholder="Lihat Semua Destinasi" />
                <label className="text-xs text-gray-500 mb-1 block">Link tujuan</label>
                <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="/destinations" />
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ DESTINATIONS PAGE ═══════════ */}
        {isDestinationsPage && (
          <>
            <SectionCard icon="📝" title="Header Halaman">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Jelajahi" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Destinasi Wisata" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Temukan destinasi impian Anda di seluruh penjuru Nusantara..." />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="⭐" title="Judul Section">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Judul "Destinasi Unggulan"</label>
                  <input type="text" value={data.highlightTitle || ''} onChange={e => update('highlightTitle', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Destinasi Unggulan" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Judul "Semua Destinasi"</label>
                  <input type="text" value={data.allTitle || ''} onChange={e => update('allTitle', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Semua Destinasi" />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ DESTINATIONS CTA ═══════════ */}
        {isDestinationsCta && (
          <>
            <SectionCard icon="📢" title="CTA Destinasi Detail">
              <p className="text-xs text-gray-500 mb-3">Gunakan <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{name}}'}</code> sebagai placeholder nama destinasi di subheading.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Label (dipakai internal)</label>
                  <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Destinasi Detail" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Heading CTA</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Siap Berpetualang?" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subheading CTA</label>
                  <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!" />
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="🔗" title="Tombol CTA">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Teks tombol</label>
                  <input type="text" value={data.ctaText || ''} onChange={e => update('ctaText', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Lihat Paket Tour" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Link tujuan</label>
                  <input type="text" value={data.ctaLink || ''} onChange={e => update('ctaLink', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="/tours" />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ TOURS PAGE ═══════════ */}
        {isToursPage && (
          <SectionCard icon="📝" title="Header Halaman">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Koleksi Kami" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Paket Wisata" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Jelajahi berbagai pilihan paket tour ke destinasi terbaik di Indonesia" />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ═══════════ BLOG PAGE ═══════════ */}
        {isBlog && (
          <SectionCard icon="📝" title="Header Halaman">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label (atas)</label>
                <input type="text" value={data.label || ''} onChange={e => update('label', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Blog & Tips" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Tips Traveling & Inspirasi Wisata" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subheading</label>
                <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Panduan lengkap untuk liburan hemat..." />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ═══════════ INVOICE PREMIUM ═══════════ */}
        {isInvoicePremium && (
          <>
            <div className="bg-gradient-to-r from-amber-900/10 to-orange-900/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌟</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Tema Premium — Desain Geometris Mewah</span>
              </div>
              <p className="text-xs text-gray-500 ml-7">Layout premium dengan header dual-panel mewah, background gelap, aksen emas, dan logo brand. Field di bawah mengikuti urutan tampilan invoice premium.</p>
            </div>

            {/* 1. HEADER — Premium Dual-Panel */}
            <SectionCard icon="🎨" title="① Header — Identitas Brand + Tagline">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Company Tagline (tampil di bawah nama brand)</label>
                <input type="text" value={(data.companyTagline as string) || ''} onChange={e => update('companyTagline', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Perjalanan Anda, Prioritas Kami" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={(data.headerTextColor as string) || '#ffffff'} onChange={e => update('headerTextColor', e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
                    <input type="text" value={(data.headerTextColor as string) || '#ffffff'} onChange={e => update('headerTextColor', e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Background</label>
                  <div className="flex gap-2">
                    <input type="color" value={(data.headerBg as string) || '#1a1a1a'} onChange={e => update('headerBg', e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
                    <input type="text" value={(data.headerBg as string) || '#1a1a1a'} onChange={e => update('headerBg', e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Gradient End</label>
                  <div className="flex gap-2">
                    <input type="color" value={(data.headerBgEnd as string) || '#1a1a1a'} onChange={e => update('headerBgEnd', e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
                    <input type="text" value={(data.headerBgEnd as string) || '#1a1a1a'} onChange={e => update('headerBgEnd', e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 2. STATUS BAR */}
            <SectionCard icon="📋" title="② Status Bar — Badge & Tanggal Diterbitkan">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Label "Diterbitkan:"</label>
                <input type="text" value={(data.labelPublishedDate as string) || ''} onChange={e => update('labelPublishedDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Diterbitkan:" />
              </div>
            </SectionCard>

            {/* 3. BODY — Invoice to: + Detail Invoice */}
            <SectionCard icon="👤" title="③ Body — Invoice to: & Detail Invoice">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 border-b pb-1">Kolom Kiri</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Heading "Invoice to:" (premium style)</label>
                    <input type="text" value={(data.headingBilledTo as string) || ''} onChange={e => update('headingBilledTo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Invoice to:" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 border-b pb-1">Kolom Kanan</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Heading "Detail Invoice"</label>
                    <input type="text" value={(data.headingInvoiceDetails as string) || ''} onChange={e => update('headingInvoiceDetails', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Detail Invoice" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Label "Invoice#" (premium style)</label>
                    <input type="text" value={(data.labelInvoiceNo as string) || ''} onChange={e => update('labelInvoiceNo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Invoice#" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Label "Tanggal"</label>
                    <input type="text" value={(data.labelInvoiceDate as string) || ''} onChange={e => update('labelInvoiceDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Tanggal" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Label "Batas Pembayaran"</label>
                    <input type="text" value={(data.labelPaymentDeadline as string) || ''} onChange={e => update('labelPaymentDeadline', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Batas Pembayaran" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 4. RINGKASAN PESANAN */}
            <SectionCard icon="📦" title="④ Ringkasan Pesanan">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading "Ringkasan Pesanan"</label>
                <input type="text" value={(data.headingOrderSummary as string) || ''} onChange={e => update('headingOrderSummary', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-3" placeholder="Ringkasan Pesanan" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'labelTourDate', label: 'Tanggal Perjalanan' },
                  { key: 'labelDuration', label: 'Durasi' },
                  { key: 'labelAdults', label: 'Dewasa' },
                  { key: 'labelChildren', label: 'Anak' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] text-gray-400 block mb-0.5">{f.label}</label>
                    <input type="text" value={(data as Record<string,unknown>)[f.key] as string || ''} onChange={e => update(f.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 5. RINCIAN BIAYA */}
            <SectionCard icon="💰" title="⑤ Rincian Biaya">
              <p className="text-xs text-gray-400 mb-3">Bagian ini menampilkan detail biaya: Dewasa (qty × harga), Anak, Sub Total, Diskon, Tax, dan Total.</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading "Rincian Biaya"</label>
                <input type="text" value={(data.headingPriceBreakdown as string) || ''} onChange={e => update('headingPriceBreakdown', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-3" placeholder="Rincian Biaya" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'labelAdults', label: 'Label "Dewasa"' },
                  { key: 'labelChildren', label: 'Label "Anak"' },
                  { key: 'labelSubTotal', label: 'Label "Sub Total"' },
                  { key: 'labelDiscount', label: 'Label "Diskon"' },
                  { key: 'labelTax', label: 'Label "Tax"' },
                  { key: 'labelTotal', label: 'Label "Total"' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] text-gray-400 block mb-0.5">{f.label}</label>
                    <input type="text" value={(data as Record<string,unknown>)[f.key] as string || ''} onChange={e => update(f.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 5½. STAMPEL LUNAS */}
            <SectionCard icon="🛡️" title="⑤½ Stempel LUNAS (Tampil di Tengah Rincian Biaya)">
              <p className="text-xs text-gray-400 mb-3">Stempel hanya muncul saat status pesanan <strong>COMPLETED / Selesai</strong>. Upload gambar stempel atau biarkan kosong untuk tampil teks "LUNAS".</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Upload Gambar Stempel (PNG transparan disarankan)</label>
                <ImageUpload
                  value={(data.stampImage as string) || ''}
                  onChange={(url) => update('stampImage', url)}
                  label=""
                  folder="tour-booking/stamps"
                  placeholder="Upload gambar stempel LUNAS"
                />
                <p className="text-[10px] text-gray-400 mt-1">Kosongkan untuk tampil teks "LUNAS" dengan aksen warna tema.</p>
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!data.showStamp} onChange={e => update('showStamp', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm text-gray-700">Tampilkan Stempel saat status Selesai</span>
                </label>
              </div>
            </SectionCard>

            {/* 6. INFORMASI PEMBAYARAN */}
            <SectionCard icon="🏦" title="⑥ Informasi Pembayaran">
              <p className="text-xs text-gray-400 mb-3">Rekening bank dikelola di <strong>Settings → Bank Accounts</strong>.</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading "Informasi Pembayaran"</label>
                <input type="text" value={(data.headingPaymentInfo as string) || ''} onChange={e => update('headingPaymentInfo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-3" placeholder="Informasi Pembayaran" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks Instruksi Transfer (tampil sebelum daftar bank)</label>
                <textarea value={(data.paymentInstructionsText as string) || ''} onChange={e => update('paymentInstructionsText', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-3"
                  placeholder="Silakan lakukan transfer ke salah satu rekening bank di bawah ini..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'labelBank', label: 'Label "Bank"' },
                  { key: 'labelAccountName', label: 'Label "a.n."' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] text-gray-400 block mb-0.5">{f.label}</label>
                    <input type="text" value={(data as Record<string,unknown>)[f.key] as string || ''} onChange={e => update(f.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 7. BATAS PEMBAYARAN */}
            <SectionCard icon="⏰" title="⑦ Batas Pembayaran">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading "Batas Pembayaran"</label>
                <input type="text" value={(data.headingDeadline as string) || ''} onChange={e => update('headingDeadline', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-3" placeholder="Batas Pembayaran" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks Deadline ({'{{date}}'})</label>
                <textarea value={(data.deadlineText as string) || ''} onChange={e => update('deadlineText', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Pembayaran harus dilakukan sebelum batas waktu yang ditentukan. Pesanan yang tidak dibayar dalam jangka waktu tersebut akan otomatis dibatalkan." />
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!data.showDeadline} onChange={e => update('showDeadline', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm text-gray-700">Tampilkan section ini</span>
                </label>
              </div>
            </SectionCard>

            {/* 8. SYARAT & KETENTUAN + TANDA TANGAN */}
            <SectionCard icon="📜" title="⑧ Syarat & Ketentuan + Tanda Tangan">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 border-b pb-1">Kolom Kiri</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Heading "Syarat & Ketentuan"</label>
                    <input type="text" value={(data.headingTerms as string) || ''} onChange={e => update('headingTerms', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Syarat & Ketentuan" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Teks Syarat & Ketentuan</label>
                    <textarea value={(data.termsText as string) || ''} onChange={e => update('termsText', e.target.value)} rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Pembayaran harus dilakukan sebelum batas waktu yang ditentukan..." />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.showTerms !== false} onChange={e => update('showTerms', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm text-gray-700">Tampilkan Syarat & Ketentuan</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 border-b pb-1">Kolom Kanan — Tanda Tangan</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Upload Gambar Tanda Tangan (PNG, max lebar 160px)</label>
                    <ImageUpload
                      value={(data.signatureImage as string) || ''}
                      onChange={(url) => update('signatureImage', url)}
                      label=""
                      folder="tour-booking/signatures"
                      placeholder="Upload gambar tanda tangan"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Kosongkan untuk tampil garis + teks.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Label "Authorised Sign"</label>
                    <input type="text" value={(data.labelSignature as string) || ''} onChange={e => update('labelSignature', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Authorised Sign" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!data.showSignature} onChange={e => update('showSignature', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm text-gray-700">Tampilkan Tanda Tangan</span>
                  </label>
                </div>
              </div>
            </SectionCard>

            {/* 9. FOOTER + TOMBOL */}
            <SectionCard icon="📄" title="⑨ Footer & Tombol Aksi">
              <p className="text-xs text-gray-400 mb-3">Placeholder <code>{'{nama}'}</code>, <code>{'{phone}'}</code>, <code>{'{email}'}</code> otomatis diambil dari <strong>Settings → Brand Identity</strong> (Nama Brand, No WhatsApp, Email Bisnis).</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teks Footer (placeholder: {'{nama}'}, {'{phone}'}, {'{email}'})</label>
                <textarea value={(data.footerText as string) || ''} onChange={e => update('footerText', e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Terima kasih telah memilih layanan kami..." />
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Link Tombol "Butuh Bantuan?"</label>
                <input type="text" value={(data.helpLink as string) || ''} onChange={e => update('helpLink', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="/contact" />
              </div>
            </SectionCard>

            {/* 10. WARNA & TAMPILAN */}
            <SectionCard icon="🎯" title="⑩ Warna (Amber/Gold) & Status Badge">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={(data.accentColor as string) || '#e59800'} onChange={e => update('accentColor', e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
                    <input type="text" value={(data.accentColor as string) || '#e59800'} onChange={e => update('accentColor', e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Border Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={(data.borderColor as string) || '#333333'} onChange={e => update('borderColor', e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
                    <input type="text" value={(data.borderColor as string) || '#333333'} onChange={e => update('borderColor', e.target.value)} className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>
              </div>
              <hr className="my-3" />
              <p className="text-xs text-gray-400 mb-4">Atur warna dan ikon untuk setiap status pesanan.</p>
              <div className="space-y-4">
                {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(status => {
                  const badge = (data.statusBadges as Record<string, Record<string, string>>)?.[status] || {};
                  return (
                    <div key={status} className="p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-700">{status}</span>
                        <span className="text-xs" style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, padding: '2px 10px', borderRadius: '999px' }}>
                          {badge.icon} {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block">Background</label>
                          <div className="flex gap-1">
                            <input type="color" value={badge.bg || '#ffffff'} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], bg: e.target.value }; update('statusBadges', sb); }} className="w-8 h-8 border rounded cursor-pointer" />
                            <input type="text" value={badge.bg || ''} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], bg: e.target.value }; update('statusBadges', sb); }} className="flex-1 border border-gray-300 rounded px-1.5 py-1 text-[10px] font-mono" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block">Text</label>
                          <input type="color" value={badge.text || '#000000'} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], text: e.target.value }; update('statusBadges', sb); }} className="w-full h-8 border rounded cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block">Border</label>
                          <input type="color" value={badge.border || '#cccccc'} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], border: e.target.value }; update('statusBadges', sb); }} className="w-full h-8 border rounded cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block">Dot</label>
                          <input type="color" value={badge.dot || '#888888'} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], dot: e.target.value }; update('statusBadges', sb); }} className="w-full h-8 border rounded cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block">Icon</label>
                          <input type="text" value={badge.icon || ''} onChange={e => { const sb = { ...(data.statusBadges as Record<string, Record<string, string>> || {}) }; sb[status] = { ...sb[status], icon: e.target.value }; update('statusBadges', sb); }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" placeholder="⏳" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════ Generic fallback ═══════════ */}
        {isGeneric && (
          <SectionCard icon="📄" title="Konten">
            <textarea value={data.body || JSON.stringify(data, null, 2)} onChange={e => { try { update('body', e.target.value); } catch { /* keep */ } }} rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </SectionCard>
        )}

        {/* ── Save ── */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Menyimpan...' : '💾 Simpan Semua Perubahan'}
          </button>
          <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-gray-700 py-2.5">Batal</Link>
          {showBlocked && (
            <span className="text-red-600 text-sm font-medium animate-fade-in">
              🚫 Hanya Super Admin yang bisa mengubah halaman ini.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Reusable section card ───

function SectionCard({ icon, title, children, addLabel, onAdd }: {
  icon: string; title: string; children: React.ReactNode; addLabel?: string; onAdd?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {addLabel && onAdd && (
          <button type="button" onClick={onAdd} className="text-blue-600 hover:text-blue-700 text-sm font-medium">{addLabel}</button>
        )}
      </div>
      {children}
    </div>
  );
}
