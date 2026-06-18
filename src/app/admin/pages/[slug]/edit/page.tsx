'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface FaqItem { question: string; answer: string; }
interface StatItem { num: string; label: string; }

const htmlPages = ['privacy', 'terms'];
const faqPages = ['home-faq'];
const statsPages = ['home-stats'];

const defaultTemplates: Record<string, string> = {
  'home-faq': JSON.stringify([{ question: '', answer: '' }]),
  'home-stats': JSON.stringify([{ num: '', label: '' }]),
  'home-hero': JSON.stringify({ heading: '', subheading: '', tagline: '', cta: '', ctaLink: '/tours' }),
  'home-value': JSON.stringify({ heading: '', subheading: '', items: [{ icon: '', title: '', desc: '' }] }),
  'footer': JSON.stringify({ text: '', links: [] }),
  'privacy': JSON.stringify({ html: '' }),
  'terms': JSON.stringify({ html: '' }),
};

export default function AdminPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Smart editor state
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [jsonContent, setJsonContent] = useState('');

  const isJsonMode = ![...htmlPages, ...faqPages, ...statsPages].includes(slug);

  useEffect(() => { fetchPage(); }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`);
      const data = await res.json();
      if (data.success) {
        setTitle(data.data.title);
        parseContent(data.data.content);
      } else {
        setTitle(slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
        const tpl = defaultTemplates[slug] || '{\n  \n}';
        parseContent(tpl);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const parseContent = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (faqPages.includes(slug)) {
        setFaqs(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ question: '', answer: '' }]);
      } else if (statsPages.includes(slug)) {
        setStats(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ num: '', label: '' }]);
      } else if (htmlPages.includes(slug)) {
        setHtmlContent(parsed.html || parsed || '');
      } else {
        setJsonContent(JSON.stringify(parsed, null, 2));
      }
    } catch {
      if (htmlPages.includes(slug)) {
        setHtmlContent(raw);
      } else {
        setJsonContent(raw);
      }
    }
  };

  const buildContent = (): string => {
    if (faqPages.includes(slug)) return JSON.stringify(faqs.filter(f => f.question));
    if (statsPages.includes(slug)) return JSON.stringify(stats.filter(s => s.label));
    if (htmlPages.includes(slug)) return JSON.stringify({ html: htmlContent });
    return jsonContent;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const content = buildContent();
      JSON.parse(content); // validate
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Halaman berhasil disimpan!', 'success');
        setTimeout(() => router.push('/admin/pages'), 800);
      } else {
        showToast(data.error || 'Gagal menyimpan', 'error');
      }
    } catch {
      showToast('Format tidak valid. Periksa kembali.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Halaman</h1>
          <p className="text-sm text-gray-500 mt-1">Slug: {slug}</p>
        </div>
        <Link href="/admin/pages" className="text-sm text-blue-600 hover:text-blue-700">← Kembali</Link>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Title */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Halaman</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
        </div>

        {/* FAQ Editor */}
        {faqPages.includes(slug) && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Daftar FAQ</h3>
              <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Tambah Pertanyaan</button>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Pertanyaan #{i + 1}</span>
                  {faqs.length > 1 && (
                    <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-xs">✕ Hapus</button>
                  )}
                </div>
                <input type="text" value={faq.question}
                  onChange={e => { const n = [...faqs]; n[i] = { ...n[i], question: e.target.value }; setFaqs(n); }}
                  placeholder="Tulis pertanyaan..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <textarea value={faq.answer}
                  onChange={e => { const n = [...faqs]; n[i] = { ...n[i], answer: e.target.value }; setFaqs(n); }}
                  rows={3} placeholder="Tulis jawaban..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>
        )}

        {/* Stats Editor */}
        {statsPages.includes(slug) && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Statistik (Trust Badges)</h3>
              <button type="button" onClick={() => setStats([...stats, { num: '', label: '' }])}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Tambah Stat</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                    {stats.length > 1 && (
                      <button type="button" onClick={() => setStats(stats.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                  <input type="text" value={stat.num}
                    onChange={e => { const n = [...stats]; n[i] = { ...n[i], num: e.target.value }; setStats(n); }}
                    placeholder="5000+" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" value={stat.label}
                    onChange={e => { const n = [...stats]; n[i] = { ...n[i], label: e.target.value }; setStats(n); }}
                    placeholder="Wisatawan" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HTML Editor (Privacy, Terms) */}
        {htmlPages.includes(slug) && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Konten (HTML)</h3>
            <p className="text-xs text-gray-400">
              Gunakan HTML: <code>&lt;h2&gt;</code> untuk judul, <code>&lt;p&gt;</code> untuk paragraf, <code>&lt;ul&gt;&lt;li&gt;</code> untuk list.
            </p>
            <textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)}
              rows={20} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" spellCheck={false}
              placeholder="<h2>Judul Section</h2><p>Isi konten...</p>" />
          </div>
        )}

        {/* JSON Editor (fallback) */}
        {isJsonMode && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Konten (JSON Format)</h3>
            <p className="text-xs text-gray-400">Gunakan format JSON yang valid.</p>
            <textarea value={jsonContent} onChange={e => setJsonContent(e.target.value)}
              rows={15} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" spellCheck={false} />
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
          <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-gray-700 py-2.5">Batal</Link>
        </div>
      </form>
    </div>
  );
}
