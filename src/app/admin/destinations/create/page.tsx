'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function CreateDestinationPage() {
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
  });
  const [gallery, setGallery] = useState<string[]>(['']);
  const [activities, setActivities] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating: parseFloat(form.rating),
          reviewCount: parseInt(form.reviewCount),
          gallery: gallery.filter((g) => g.trim()),
          activities: activities.filter((a) => a.trim()),
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/admin/destinations');
      } else {
        setError(data.error || 'Gagal membuat destinasi');
      }
    } catch {
      setError('Gagal membuat destinasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Destinasi Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Buat halaman destinasi wisata baru</p>
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
              placeholder="Contoh: Bali"
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
                placeholder="Contoh: Bali, Indonesia"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Terbaik Berkunjung</label>
              <input
                type="text"
                value={form.bestTimeToVisit}
                onChange={(e) => updateField('bestTimeToVisit', e.target.value)}
                placeholder="Contoh: April - Oktober"
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
              placeholder="Deskripsi singkat yang muncul di card destinasi..."
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
              placeholder="<p>Deskripsi lengkap tentang destinasi...</p>"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Gambar</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar Utama *</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://images.unsplash.com/photo-xxx?w=1200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
            {form.imageUrl && (
              <div className="mt-2 w-40 h-28 relative rounded-lg border overflow-hidden">
                <Image
                  src={form.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Galeri Foto</label>
            {gallery.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateGallery(i, e.target.value)}
                  placeholder={`URL foto ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeGallery(i)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addGalleryItem}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
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
                placeholder={`Aktivitas ${i + 1}: Contoh: Snorkeling, Trekking, ...`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => removeActivity(i)}
                className="text-red-500 hover:text-red-700 px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addActivity}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Tambah Aktivitas
          </button>
        </div>

        {/* Rating & Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Rating & Pengaturan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
              <input
                type="number"
                value={form.rating}
                onChange={(e) => updateField('rating', e.target.value)}
                min="1"
                max="5"
                step="0.1"
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

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Destinasi'}
          </button>
          <Link href="/admin/destinations" className="text-sm text-gray-500 hover:text-gray-700 py-2.5">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
