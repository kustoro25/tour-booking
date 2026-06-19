'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import ImageUpload from '@/components/ui/ImageUpload';

export default function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    location: '',
    imageUrl: '',
    bestTimeToVisit: '',
    rating: '5.0',
    reviewCount: '0',
    highlight: false,
    isActive: true,
    sortOrder: '0',
    ctaHeading: 'Siap Berpetualang?',
    ctaSubheading: 'Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!',
    ctaButtonText: 'Lihat Paket Tour',
    ctaButtonLink: '/tours',
  });
  const [gallery, setGallery] = useState<string[]>(['']);
  const [activities, setActivities] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDestination();
  }, [id]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchDestination = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/destinations/${id}`);
      const data = await res.json();
      if (data.success) {
        const dest = data.data;
        setForm({
          name: dest.name,
          shortDescription: dest.shortDescription,
          description: dest.description,
          location: dest.location,
          imageUrl: dest.imageUrl,
          bestTimeToVisit: dest.bestTimeToVisit || '',
          rating: String(dest.rating),
          reviewCount: String(dest.reviewCount),
          highlight: dest.highlight,
          isActive: dest.isActive,
          sortOrder: String(dest.sortOrder || 0),
          ctaHeading: dest.ctaHeading || 'Siap Berpetualang?',
          ctaSubheading: dest.ctaSubheading || 'Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!',
          ctaButtonText: dest.ctaButtonText || 'Lihat Paket Tour',
          ctaButtonLink: dest.ctaButtonLink || '/tours',
        });
        try {
          const g = JSON.parse(dest.gallery);
          setGallery(g.length > 0 ? g : ['']);
        } catch {
          setGallery(['']);
        }
        try {
          const a = JSON.parse(dest.activities);
          setActivities(a.length > 0 ? a : ['']);
        } catch {
          setActivities(['']);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) =>
    setForm({ ...form, [field]: value });

  const addGalleryItem = () => setGallery([...gallery, '']);
  const updateGallery = (index: number, value: string) => {
    const updated = [...gallery];
    updated[index] = value;
    setGallery(updated);
  };
  const removeGallery = (index: number) => {
    if (gallery.length <= 1) return;
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const addActivity = () => setActivities([...activities, '']);
  const updateActivity = (index: number, value: string) => {
    const updated = [...activities];
    updated[index] = value;
    setActivities(updated);
  };
  const removeActivity = (index: number) => {
    if (activities.length <= 1) return;
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/admin/destinations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating: parseFloat(form.rating),
          reviewCount: parseInt(form.reviewCount),
          sortOrder: parseInt(form.sortOrder),
          gallery: gallery.filter((g) => g.trim()),
          activities: activities.filter((a) => a.trim()),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Destinasi berhasil diperbarui!');
        setTimeout(() => router.push('/admin/destinations'), 1500);
      } else {
        setError(data.error || 'Gagal memperbarui');
      }
    } catch {
      setError('Gagal memperbarui destinasi');
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Destinasi</h1>
          <p className="text-sm text-gray-500 mt-1">{form.name || 'Loading...'}</p>
        </div>
        <Link href="/admin/destinations" className="text-sm text-blue-600 hover:text-blue-700">
          ← Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informasi Dasar</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Destinasi *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Terbaik Berkunjung</label>
              <input
                type="text"
                value={form.bestTimeToVisit}
                onChange={(e) => updateField('bestTimeToVisit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat *</label>
            <textarea
              value={form.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap (HTML)</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Gambar</h2>

          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => updateField('imageUrl', url)}
              label="Gambar Utama"
              folder="tour-booking/destinations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Galeri Foto</label>
            {gallery.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <ImageUpload
                    value={url}
                    onChange={(newUrl) => updateGallery(i, newUrl)}
                    folder="tour-booking/destinations/gallery"
                    placeholder={`URL foto ${i + 1}`}
                  />
                </div>
                <button type="button" onClick={() => removeGallery(i)} className="text-red-500 hover:text-red-700 px-2 mt-2">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGalleryItem} className="text-sm text-blue-600 hover:text-blue-700">
              + Tambah Foto
            </button>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Aktivitas</h2>
          {activities.map((act, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={act}
                onChange={(e) => updateActivity(i, e.target.value)}
                placeholder={`Aktivitas ${i + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button type="button" onClick={() => removeActivity(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={addActivity} className="text-sm text-blue-600 hover:text-blue-700">
            + Tambah Aktivitas
          </button>
        </div>

        {/* CTA Section (per destination) */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">📢 CTA Section (Sisi Kanan Halaman)</h2>
          <p className="text-xs text-gray-500">Gunakan <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{name}}'}</code> sebagai placeholder nama destinasi di subheading.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heading CTA</label>
            <input
              type="text"
              value={form.ctaHeading}
              onChange={(e) => updateField('ctaHeading', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Siap Berpetualang?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subheading CTA</label>
            <textarea
              value={form.ctaSubheading}
              onChange={(e) => updateField('ctaSubheading', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="Pilih paket tour terbaik ke {{name}} dan wujudkan liburan impian Anda!"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tombol</label>
              <input
                type="text"
                value={form.ctaButtonText}
                onChange={(e) => updateField('ctaButtonText', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Lihat Paket Tour"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Tombol</label>
              <input
                type="text"
                value={form.ctaButtonLink}
                onChange={(e) => updateField('ctaButtonLink', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="/tours"
              />
            </div>
          </div>
        </div>

        {/* Rating & Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Rating & Pengaturan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
              <input
                type="number"
                value={form.rating}
                onChange={(e) => updateField('rating', e.target.value)}
                min="1" max="5" step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Ulasan</label>
              <input
                type="number"
                value={form.reviewCount}
                onChange={(e) => updateField('reviewCount', e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Tampil</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => updateField('sortOrder', e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={(e) => updateField('highlight', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Destinasi Unggulan ⭐</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Aktif</span>
            </label>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{message}</div>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
          <Link href="/admin/destinations" className="text-sm text-gray-500 hover:text-gray-700 py-2.5">Batal</Link>
        </div>
      </form>
    </div>
  );
}
