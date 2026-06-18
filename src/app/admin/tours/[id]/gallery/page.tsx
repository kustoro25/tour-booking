'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

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
  const [coverImg, setCoverImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [adding, setAdding] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTour();
    fetchImages();
  }, []);

  const fetchTour = async () => {
    const res = await fetch(`/api/admin/tours/${tourId}`);
    const data = await res.json();
    if (data.success) {
      setTourName(data.data.name);
      setCoverImg(data.data.coverImg || '');
    }
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
      showToast('Foto berhasil ditambahkan', 'success');
    } else {
      setMessage(data.error || 'Gagal menambahkan foto');
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/tours/${tourId}/gallery`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: deleteTarget }),
    });
    fetchImages();
    showToast('Foto berhasil dihapus', 'success');
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Drag & Drop
  const handleDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;

    const updated = [...images];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(index, 0, moved);
    setImages(updated);
    setDragIdx(index);
  };

  const handleDragEnd = async () => {
    setDragIdx(null);
    const ordered = images.map((img, i) => ({ id: img.id, sortOrder: i }));
    const res = await fetch(`/api/admin/tours/${tourId}/gallery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: ordered }),
    });
    const data = await res.json();
    if (data.success) {
      setImages(data.data || []);
      showToast('Urutan foto diperbarui', 'success');
    }
  };

  return (
    <div>
      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-[scaleIn_0.2s_ease]">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Hapus Foto?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Foto ini akan dihapus dari galeri.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">🖼️</span>
          <h2 className="font-semibold text-gray-900">Tambah Foto Baru</h2>
          <span className="text-xs text-gray-400 ml-auto">{images.length}/10 foto</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar *</label>
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
            <input
              type="text"
              value={newAlt}
              onChange={e => setNewAlt(e.target.value)}
              placeholder="Deskripsi gambar untuk SEO"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={adding || images.length >= 10}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">📸</span>
          <h2 className="font-semibold text-gray-900">Galeri ({images.length}/10)</h2>
          {images.length > 0 && (
            <span className="text-xs text-gray-400 ml-2">Drag & drop untuk mengurutkan</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-2">
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="text-gray-500">Belum ada foto di galeri</p>
            <p className="text-xs text-gray-400 mt-1">Tambahkan foto untuk mempercantik tampilan paket tour</p>
          </div>
        ) : (
          <>
            {/* Cover image preview */}
            {coverImg && (
              <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Cover</span>
                  <span className="text-xs text-gray-500">Foto sampul paket tour</span>
                </div>
                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-200 relative">
                  <Image src={coverImg} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative bg-gray-100 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                    dragIdx === index ? 'opacity-50 scale-95 ring-2 ring-blue-400' : 'hover:shadow-lg'
                  }`}
                >
                  {/* Number badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>

                  {/* Image */}
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={img.imageUrl}
                      alt={img.altText || 'Gallery'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f3f4f6" width="200" height="150"/><text x="100" y="80" text-anchor="middle" fill="%239ca3af" font-size="14">No Image</text></svg>';
                      }}
                    />
                  </div>

                  {/* Hover overlay with delete button */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => setDeleteTarget(img.id)}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-all transform translate-y-2 group-hover:translate-y-0"
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  </div>

                  {/* Info bar */}
                  <div className="p-2 text-xs">
                    <p className="text-gray-500 truncate">{img.altText || 'Tanpa deskripsi'}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
