'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { TourCategoryLabels } from '@/types';
import type { TourCategory, ItineraryDay } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface DestinationOption {
  id: string;
  name: string;
  location: string;
}

export default function EditTourPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [form, setForm] = useState({
    name: '', category: 'OPEN_TRIP', destination: '', destinationId: '', duration: '',
    priceAdult: '', priceChild: '0', discount: '0', maxSlot: '15', minPax: '2',
    coverImg: '', terms: '', isActive: true,
  });
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [includes, setIncludes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgPreview, setImgPreview] = useState('');

  useEffect(() => {
    fetch('/api/admin/destinations')
      .then(r => r.json())
      .then(data => {
        if (data.success) setDestinations(data.data.filter((d: DestinationOption & { isActive: boolean }) => d.isActive));
      })
      .catch(() => {});

    fetch(`/api/admin/tours/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const t = data.data;
          setForm({
            name: t.name, category: t.category, destination: t.destination, destinationId: t.destinationId || '',
            duration: t.duration, priceAdult: String(t.priceAdult), priceChild: String(t.priceChild),
            discount: String(t.discount), maxSlot: String(t.maxSlot), minPax: String(t.minPax),
            coverImg: t.coverImg || '', terms: t.terms || '', isActive: t.isActive,
          });
          if (t.coverImg) setImgPreview(t.coverImg);
          const it = JSON.parse(t.itinerary || '[]');
          setItinerary(it.length > 0 ? it : [{ day: 1, title: '', description: '' }]);
          const inc = JSON.parse(t.includes || '[]');
          setIncludes(inc.length > 0 ? inc : ['']);
          const exc = JSON.parse(t.excludes || '[]');
          setExcludes(exc.length > 0 ? exc : ['']);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field: string, value: string | boolean) => {
    setForm({ ...form, [field]: value } as typeof form);
    if (field === 'coverImg') setImgPreview(value as string);
  };

  const handleDestinationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const destId = e.target.value;
    if (destId === '__custom__') {
      setForm({ ...form, destinationId: '', destination: '' });
      return;
    }
    const selected = destinations.find(d => d.id === destId);
    if (selected) setForm({ ...form, destinationId: selected.id, destination: selected.name });
  };

  // Itinerary helpers
  const addItineraryDay = () => setItinerary([...itinerary, { day: itinerary.length + 1, title: '', description: '' }]);
  const removeItineraryDay = (index: number) => {
    if (itinerary.length <= 1) return;
    setItinerary(itinerary.filter((_, i) => i !== index));
  };
  const updateItinerary = (index: number, field: string, value: string) => {
    const updated = [...itinerary];
    if (field === 'day') updated[index] = { ...updated[index], day: parseInt(value) || 1 };
    else if (field === 'title' || field === 'description') updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  // Includes/Excludes helpers
  const addItem = (type: 'includes' | 'excludes') => {
    if (type === 'includes') setIncludes([...includes, '']);
    else setExcludes([...excludes, '']);
  };
  const removeItem = (type: 'includes' | 'excludes', index: number) => {
    if (type === 'includes' && includes.length <= 1) return;
    if (type === 'excludes' && excludes.length <= 1) return;
    if (type === 'includes') setIncludes(includes.filter((_, i) => i !== index));
    else setExcludes(excludes.filter((_, i) => i !== index));
  };
  const updateItem = (type: 'includes' | 'excludes', index: number, value: string) => {
    if (type === 'includes') { const up = [...includes]; up[index] = value; setIncludes(up); }
    else { const up = [...excludes]; up[index] = value; setExcludes(up); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tours/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          priceAdult: parseFloat(form.priceAdult),
          priceChild: parseFloat(form.priceChild),
          discount: parseFloat(form.discount),
          maxSlot: parseInt(form.maxSlot),
          minPax: parseInt(form.minPax),
          itinerary: itinerary.filter(i => i.title),
          includes: includes.filter(i => i),
          excludes: excludes.filter(i => i),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Paket tour berhasil diperbarui!', 'success');
        setTimeout(() => router.push('/admin/tours'), 500);
      } else setError(data.error || 'Gagal menyimpan');
    } catch { setError('Terjadi kesalahan'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tours" className="text-gray-500 hover:text-gray-700 transition-colors">← Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Paket Tour</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card 1: Informasi Paket */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📋</span>
            <h2 className="text-lg font-semibold text-gray-900">Informasi Paket</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
              <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select value={form.category} onChange={e => updateField('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                {(Object.keys(TourCategoryLabels) as TourCategory[]).map(cat => (
                  <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinasi</label>
              <select value={form.destinationId} onChange={handleDestinationSelect}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- Pilih Destinasi --</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.location}</option>
                ))}
                <option value="__custom__">➕ Custom (manual)</option>
              </select>
              {!form.destinationId && (
                <input type="text" value={form.destination}
                  onChange={e => updateField('destination', e.target.value)}
                  placeholder="Nama destinasi custom..."
                  className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
              <input type="text" required value={form.duration} onChange={e => updateField('duration', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.isActive ? 'true' : 'false'} onChange={e => updateField('isActive', e.target.value === 'true')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="true">🟢 Aktif</option>
                <option value="false">🔴 Nonaktif</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Sampul</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input type="text" value={form.coverImg} onChange={e => updateField('coverImg', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    placeholder="https://example.com/image.jpg" />
                </div>
                {imgPreview && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                    <Image src={imgPreview} alt="Preview" fill className="object-cover" sizes="96px" onError={() => setImgPreview('')} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Harga & Kuota */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">💰</span>
            <h2 className="text-lg font-semibold text-gray-900">Harga & Kuota</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dewasa (Rp)</label>
              <input type="number" required value={form.priceAdult} onChange={e => updateField('priceAdult', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Anak (Rp)</label>
              <input type="number" value={form.priceChild} onChange={e => updateField('priceChild', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (%)</label>
              <input type="number" value={form.discount} onChange={e => updateField('discount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kuota Maksimal</label>
              <input type="number" value={form.maxSlot} onChange={e => updateField('maxSlot', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Peserta</label>
              <input type="number" value={form.minPax} onChange={e => updateField('minPax', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
            </div>
          </div>
        </div>

        {/* Card 3: Itinerary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">🗓️</span>
              <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
            </div>
            <button type="button" onClick={addItineraryDay}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Hari
            </button>
          </div>
          <div className="space-y-3">
            {itinerary.map((day, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="w-10 flex-shrink-0">
                  <input type="number" value={day.day} onChange={e => updateItinerary(i, 'day', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center font-medium" />
                </div>
                <div className="flex-1 space-y-2">
                  <input type="text" value={day.title} onChange={e => updateItinerary(i, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    placeholder="Judul aktivitas..." />
                  <textarea value={day.description} onChange={e => updateItinerary(i, 'description', e.target.value)}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Deskripsi detail..." />
                </div>
                <button type="button" onClick={() => removeItineraryDay(i)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Fasilitas & Ketentuan */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm">✅</span>
            <h2 className="text-lg font-semibold text-gray-900">Fasilitas & Ketentuan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Fasilitas Termasuk</label>
                <button type="button" onClick={() => addItem('includes')}
                  className="text-blue-600 text-xs hover:text-blue-700 transition-colors">+ Tambah</button>
              </div>
              <div className="space-y-2">
                {includes.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={item} onChange={e => updateItem('includes', i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Transport AC..." />
                    <button type="button" onClick={() => removeItem('includes', i)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Fasilitas Tidak Termasuk</label>
                <button type="button" onClick={() => addItem('excludes')}
                  className="text-blue-600 text-xs hover:text-blue-700 transition-colors">+ Tambah</button>
              </div>
              <div className="space-y-2">
                {excludes.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={item} onChange={e => updateItem('excludes', i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Tiket pesawat..." />
                    <button type="button" onClick={() => removeItem('excludes', i)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan</label>
            <textarea value={form.terms} onChange={e => updateField('terms', e.target.value)} rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tulis syarat dan ketentuan paket tour..." />
          </div>
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
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Menyimpan...
              </>
            ) : 'Simpan Perubahan'}
          </button>
          <Link href="/admin/tours"
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
