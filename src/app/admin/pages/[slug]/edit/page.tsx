'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import ImageUpload from '@/components/ui/ImageUpload';

// ─── Data schemas per page type ───

interface FaqItem { question: string; answer: string; }
interface StatItem { num: string; label: string; }
interface ValueItem { icon: string; title: string; desc: string; color: string; }

type PageData = {
  // home-hero
  tagline?: string;
  heading?: string;
  headingHighlight?: string;
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
  // home-stats landing
  landingStats?: StatItem[];
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
  // footer
  text?: string;
  // generic fallback
  body?: string;
  [key: string]: string | number | boolean | object | undefined | null | string[] | Record<string, unknown>[];
};

const defaultData: Record<string, PageData> = {
  'home-hero': {
    tagline: '🔥 Ribuan wisatawan telah berangkat bersama kami',
    heading: 'Jelajahi Destinasi',
    headingHighlight: 'Impian',
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
    faqs: [
      { question: 'Bagaimana cara melakukan booking?', answer: 'Caranya sangat mudah! Pilih paket tour yang Anda inginkan, tentukan tanggal keberangkatan dari kalender interaktif, isi data diri dan jumlah peserta, lalu klik "Booking Sekarang". Invoice akan langsung terbit dan dikirim ke email Anda.' },
      { question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami menerima transfer bank (BCA, Mandiri, BRI, BNI) dan e-wallet (OVO, Dana, GoPay, ShopeePay). Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika melebihi batas waktu, pesanan akan otomatis dibatalkan.' },
      { question: 'Bagaimana kebijakan pembatalan dan refund?', answer: 'Pembatalan H-14: refund 80%. H-7: refund 50%. H-3: refund 25%. Kurang dari H-3: tidak ada refund. Jika tour dibatalkan oleh kami karena force majeure atau kuota minimal tidak terpenuhi, Anda mendapat refund 100%.' },
      { question: 'Apakah ada minimal peserta untuk setiap tour?', answer: 'Ya, setiap paket tour memiliki minimal peserta (umumnya 2 orang). Informasi ini tercantum di halaman detail masing-masing paket. Jika kuota minimal tidak terpenuhi, tim kami akan menghubungi Anda untuk opsi alternatif.' },
    ],
  },
  'home-stats': {
    landingStats: [
      { num: '5000+', label: 'Wisatawan' },
      { num: '50+', label: 'Destinasi' },
      { num: '4.9', label: 'Rating ★' },
    ],
  },
  'privacy': { html: '' },
  'terms': { html: '' },
  'about': {
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
    heading: 'Hubungi Kami',
    subheading: 'Punya pertanyaan atau butuh bantuan memilih paket? Tim kami siap membantu!',
    infoCards: [
      { icon: '📞', title: 'WhatsApp', detail: '+62 812-3456-7890', color: 'from-green-500 to-green-600' },
      { icon: '📧', title: 'Email', detail: 'info@jelajahnusantara.com', color: 'from-blue-500 to-blue-600' },
      { icon: '🕐', title: 'Jam Operasional', detail: 'Senin – Jumat, 09.00 – 18.00 WIB', color: 'from-purple-500 to-purple-600' },
      { icon: '📍', title: 'Alamat', detail: 'Jl. Pariwisata No. 123, Jakarta Selatan', color: 'from-orange-500 to-orange-600' },
    ],
  },
  'testimonials': {
    heading: 'Cerita dari Mereka yang Telah Berpetualang',
    subheading: 'Kepuasan Anda adalah kebahagiaan kami. Lihat apa kata mereka yang sudah merasakan serunya liburan tanpa beban bersama Jelajah Nusantara.',
  },
  'footer': { text: 'Platform booking tour terpercaya untuk menjelajahi destinasi terbaik di Indonesia.' },
};

export default function AdminPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PageData>({});

  const isHero = slug === 'home-hero';
  const isValue = slug === 'home-value';
  const isFaq = slug === 'home-faq';
  const isStats = slug === 'home-stats';
  const isHtml = slug === 'privacy' || slug === 'terms';
  const isAbout = slug === 'about';
  const isContact = slug === 'contact';
  const isTestimonials = slug === 'testimonials';
  const isFooter = slug === 'footer';
  const isGeneric = !isHero && !isValue && !isFaq && !isStats && !isHtml && !isAbout && !isContact && !isTestimonials && !isFooter;

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Teks kiri</label>
                  <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Jelajahi Destinasi" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Highlight (oranye)</label>
                  <input type="text" value={data.headingHighlight || ''} onChange={e => update('headingHighlight', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Impian" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Hasil: <strong>{data.heading || 'Jelajahi Destinasi'}</strong> <span className="text-orange-500 font-bold">{data.headingHighlight || 'Impian'}</span> Anda Tanpa Ribet!</p>
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
              <div className="grid grid-cols-3 gap-4">
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
        )}

        {/* ═══════════ HOME - STATS (standalone) ═══════════ */}
        {isStats && (
          <SectionCard icon="📊" title="Statistik Landing Page">
            <div className="grid grid-cols-3 gap-4">
              {(data.landingStats || []).map((s, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-xs text-gray-500">#{i + 1}</label>
                  <input type="text" value={s.num} onChange={e => {
                    const st = [...(data.landingStats || [])]; st[i] = { ...st[i], num: e.target.value }; update('landingStats', st);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5000+" />
                  <input type="text" value={s.label} onChange={e2 => {
                    const st = [...(data.landingStats || [])]; st[i] = { ...st[i], label: e2.target.value }; update('landingStats', st);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Wisatawan" />
                </div>
              ))}
            </div>
          </SectionCard>
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
            <SectionCard icon="📝" title="Header">
              <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2" />
              <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
          <SectionCard icon="💬" title="Header Testimoni">
            <input type="text" value={data.heading || ''} onChange={e => update('heading', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2" placeholder="Heading" />
            <textarea value={data.subheading || ''} onChange={e => update('subheading', e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Subheading" />
          </SectionCard>
        )}

        {/* ═══════════ FOOTER ═══════════ */}
        {isFooter && (
          <SectionCard icon="📄" title="Footer Text">
            <textarea value={data.text || ''} onChange={e => update('text', e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Deskripsi singkat di footer..." />
          </SectionCard>
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
