'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import ImageUpload from '@/components/ui/ImageUpload';

const blogCategories = ['Umum', 'Tips Traveling', 'Destinasi', 'Budget & Hemat', 'Budaya & Kuliner', 'Itinerary', 'Review'];

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', coverImg: '',
    category: 'Umum', tags: '', author: 'Admin', isPublished: true,
    metaTitle: '', metaDesc: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const p = data.data;
          let tagsStr = '';
          try { tagsStr = JSON.parse(p.tags).join(', '); } catch { tagsStr = p.tags || ''; }
          setForm({
            title: p.title, excerpt: p.excerpt || '', content: p.content, coverImg: p.coverImg || '',
            category: p.category, tags: tagsStr, author: p.author || 'Admin',
            isPublished: p.isPublished, metaTitle: p.metaTitle || '', metaDesc: p.metaDesc || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field: string, value: string | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? JSON.stringify(form.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) : '[]',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Artikel berhasil diperbarui!', 'success');
        setTimeout(() => router.push('/admin/blog'), 500);
      } else {
        setError(data.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Terjadi kesalahan');
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="text-gray-500 hover:text-gray-700 transition-colors">← Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Artikel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📝</span>
            <h2 className="text-lg font-semibold text-gray-900">Konten Artikel</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Artikel *</label>
            <input type="text" required value={form.title} onChange={e => updateField('title', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan / Excerpt</label>
            <textarea value={form.excerpt} onChange={e => updateField('excerpt', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konten (HTML) *</label>
            <textarea value={form.content} onChange={e => updateField('content', e.target.value)} rows={12}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm font-mono" required />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">🖼️</span>
            <h2 className="text-lg font-semibold text-gray-900">Gambar & Metadata</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <ImageUpload value={form.coverImg} onChange={(url) => updateField('coverImg', url)} label="Cover Image" folder="tour-booking/blog" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select value={form.category} onChange={e => updateField('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                {blogCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penulis</label>
              <input type="text" value={form.author} onChange={e => updateField('author', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (pisahkan dengan koma)</label>
              <input type="text" value={form.tags} onChange={e => updateField('tags', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" placeholder="Bali, Hemat, Tips" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">🔍</span>
            <h2 className="text-lg font-semibold text-gray-900">SEO & Publikasi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input type="text" value={form.metaTitle} onChange={e => updateField('metaTitle', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <input type="text" value={form.metaDesc} onChange={e => updateField('metaDesc', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => updateField('isPublished', e.target.checked)} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Publikasikan</span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving ? (<> <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Menyimpan... </>) : '💾 Simpan Perubahan'}
          </button>
          <Link href="/admin/blog" className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">Batal</Link>
        </div>
      </form>
    </div>
  );
}
