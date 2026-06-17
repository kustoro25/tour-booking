'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface GalleryImage {
  id: string;
  tourId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

export default function AdminGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tourId } = use(params);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [tourName, setTourName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTour();
    fetchImages();
  }, []);

  const fetchTour = async () => {
    const res = await fetch(`/api/admin/tours/${tourId}`);
    const data = await res.json();
    if (data.success) setTourName(data.data.name);
  };

  const fetchImages = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/tours/${tourId}/gallery`);
    const data = await res.json();
    if (data.success) setImages(data.data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setAdding(true);
    setMessage('');
    const res = await fetch(`/api/admin/tours/${tourId}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: newUrl, altText: newAlt }),
    });
    const data = await res.json();
    if (data.success) {
      setNewUrl('');
      setNewAlt('');
      fetchImages();
      setMessage('Foto berhasil ditambahkan');
    } else {
      setMessage(data.error || 'Gagal menambahkan foto');
    }
    setAdding(false);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Hapus foto ini?')) return;
    await fetch(`/api/admin/tours/${tourId}/gallery`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    fetchImages();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    await saveOrder(updated);
  };

  const moveDown = async (index: number) => {
    if (index === images.length - 1) return;
    const updated = [...images];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    await saveOrder(updated);
  };

  const saveOrder = async (ordered: GalleryImage[]) => {
    const payload = ordered.map((img, i) => ({ id: img.id, sortOrder: i }));
    const res = await fetch(`/api/admin/tours/${tourId}/gallery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: payload }),
    });
    const data = await res.json();
    if (data.success) setImages(data.data || []);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeri Foto</h1>
          {tourName && <p className="text-sm text-gray-500 mt-1">{tourName}</p>}
        </div>
        <Link href="/admin/tours" className="text-sm text-blue-600 hover:text-blue-700">
          ← Kembali ke Daftar Paket
        </Link>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tambah Foto Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar *</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
            <input
              type="text"
              value={newAlt}
              onChange={(e) => setNewAlt(e.target.value)}
              placeholder="Deskripsi gambar untuk SEO"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={adding || images.length >= 10}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Menambahkan...' : '+ Tambah Foto'}
          </button>
          {images.length >= 10 && (
            <span className="text-xs text-orange-600">Maksimal 10 foto (sudah penuh)</span>
          )}
        </div>
        {message && (
          <p className={`mt-3 text-sm ${message.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>

      {/* Gallery Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Daftar Foto ({images.length}/10)
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada foto di galeri</p>
        ) : (
          <div className="space-y-4">
            {images.map((img, index) => (
              <div key={img.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={img.imageUrl}
                    alt={img.altText || 'Gallery image'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><text x="10" y="45" font-size="12" fill="gray">No img</text></svg>'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{img.imageUrl}</p>
                  <p className="text-xs text-gray-500">{img.altText || 'Tanpa alt text'} · Urutan: {index + 1}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Naikkan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === images.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Turunkan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="p-1 text-red-400 hover:text-red-600 ml-1"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
