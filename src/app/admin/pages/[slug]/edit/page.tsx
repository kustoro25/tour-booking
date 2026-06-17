'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`);
      const data = await res.json();
      if (data.success) {
        setTitle(data.data.title);
        try {
          const parsed = JSON.parse(data.data.content);
          setContent(JSON.stringify(parsed, null, 2));
        } catch {
          setContent(data.data.content);
        }
      } else {
        // New page with default values
        setTitle(slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
        setContent('{\n  \n}');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Validate JSON
      JSON.parse(content);

      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Halaman berhasil disimpan!');
        setTimeout(() => router.push('/admin/pages'), 1500);
      } else {
        setMessage(data.error || 'Gagal menyimpan');
      }
    } catch {
      setMessage('Format JSON tidak valid. Periksa kembali konten.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Halaman</h1>
          <p className="text-sm text-gray-500 mt-1">Slug: {slug}</p>
        </div>
        <Link href="/admin/pages" className="text-sm text-blue-600 hover:text-blue-700">
          ← Kembali
        </Link>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Halaman</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konten (JSON Format)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Konten disimpan dalam format JSON. Pastikan format valid sebelum menyimpan.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            spellCheck={false}
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
          <Link
            href="/admin/pages"
            className="text-sm text-gray-500 hover:text-gray-700 py-2.5"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
