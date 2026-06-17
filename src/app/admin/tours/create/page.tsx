'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TourCategoryLabels } from '@/types';
import type { TourCategory, ItineraryDay } from '@/types';

export default function CreateTourPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', category: 'OPEN_TRIP', destination: '', duration: '',
    priceAdult: '', priceChild: '0', discount: '0', maxSlot: '15', minPax: '2',
    coverImg: '', terms: '',
  });
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([{ day: 1, title: '', description: '' }]);
  const [includes, setIncludes] = useState<string[]>(['']);
  const [excludes, setExcludes] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => setForm({ ...form, [field]: value });

  const addItineraryDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, title: '', description: '' }]);
  };

  const updateItinerary = (index: number, field: string, value: string) => {
    const updated = [...itinerary];
    const day = updated[index];
    if (field === 'day') {
      updated[index] = { ...day, day: parseInt(value) || 1 };
    } else if (field === 'title' || field === 'description') {
      updated[index] = { ...day, [field]: value };
    }
    setItinerary(updated);
  };

  const addItem = (type: 'includes' | 'excludes') => {
    if (type === 'includes') setIncludes([...includes, '']);
    else setExcludes([...excludes, '']);
  };

  const updateItem = (type: 'includes' | 'excludes', index: number, value: string) => {
    if (type === 'includes') {
      const updated = [...includes]; updated[index] = value; setIncludes(updated);
    } else {
      const updated = [...excludes]; updated[index] = value; setExcludes(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          priceAdult: parseFloat(form.priceAdult) || 0,
          priceChild: parseFloat(form.priceChild) || 0,
          discount: parseFloat(form.discount) || 0,
          maxSlot: parseInt(form.maxSlot) || 15,
          minPax: parseInt(form.minPax) || 2,
          itinerary: itinerary.filter(i => i.title),
          includes: includes.filter(i => i),
          excludes: excludes.filter(i => i),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/tours');
      } else {
        setError(data.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tours" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Paket Tour</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
            <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={form.category} onChange={e => updateField('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {(Object.keys(TourCategoryLabels) as TourCategory[]).map(cat => (
                <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinasi</label>
            <input type="text" required value={form.destination} onChange={e => updateField('destination', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Bali" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
            <input type="text" required value={form.duration} onChange={e => updateField('duration', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="3 Hari 2 Malam" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dewasa (Rp)</label>
            <input type="number" required value={form.priceAdult} onChange={e => updateField('priceAdult', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Anak (Rp)</label>
            <input type="number" value={form.priceChild} onChange={e => updateField('priceChild', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (%)</label>
            <input type="number" value={form.discount} onChange={e => updateField('discount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kuota Maksimal</label>
            <input type="number" value={form.maxSlot} onChange={e => updateField('maxSlot', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Peserta</label>
            <input type="number" value={form.minPax} onChange={e => updateField('minPax', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Sampul</label>
            <input type="text" value={form.coverImg} onChange={e => updateField('coverImg', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
          </div>
        </div>

        {/* Itinerary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Itinerary</label>
            <button type="button" onClick={addItineraryDay} className="text-blue-600 text-sm hover:text-blue-700">+ Tambah Hari</button>
          </div>
          {itinerary.map((day, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <input type="number" value={day.day} onChange={e => updateItinerary(i, 'day', e.target.value)} className="col-span-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Hari" />
              <input type="text" value={day.title} onChange={e => updateItinerary(i, 'title', e.target.value)} className="col-span-4 px-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Judul" />
              <textarea value={day.description} onChange={e => updateItinerary(i, 'description', e.target.value)} rows={2} className="col-span-7 px-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Deskripsi aktivitas..." />
            </div>
          ))}
        </div>

        {/* Includes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Fasilitas Termasuk</label>
            <button type="button" onClick={() => addItem('includes')} className="text-blue-600 text-sm">+ Tambah</button>
          </div>
          {includes.map((item, i) => (
            <input key={i} type="text" value={item} onChange={e => updateItem('includes', i, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="Transport AC..." />
          ))}
        </div>

        {/* Excludes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Fasilitas Tidak Termasuk</label>
            <button type="button" onClick={() => addItem('excludes')} className="text-blue-600 text-sm">+ Tambah</button>
          </div>
          {excludes.map((item, i) => (
            <input key={i} type="text" value={item} onChange={e => updateItem('excludes', i, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" placeholder="Tiket pesawat..." />
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Syarat & Ketentuan</label>
          <textarea value={form.terms} onChange={e => updateField('terms', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan Paket'}
          </button>
          <Link href="/admin/tours" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Batal</Link>
        </div>
      </form>
    </div>
  );
}
