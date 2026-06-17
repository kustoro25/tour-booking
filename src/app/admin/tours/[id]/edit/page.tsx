'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TourCategoryLabels } from '@/types';
import type { TourCategory, ItineraryDay } from '@/types';

export default function EditTourPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: '', category: 'OPEN_TRIP', destination: '', duration: '',
    priceAdult: '', priceChild: '0', discount: '0', maxSlot: '15', minPax: '2',
    coverImg: '', terms: '', isActive: true,
  });
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [includes, setIncludes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/tours/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const t = data.data;
          setForm({
            name: t.name, category: t.category, destination: t.destination, duration: t.duration,
            priceAdult: String(t.priceAdult), priceChild: String(t.priceChild), discount: String(t.discount),
            maxSlot: String(t.maxSlot), minPax: String(t.minPax), coverImg: t.coverImg || '', terms: t.terms || '',
            isActive: t.isActive,
          });
          setItinerary(JSON.parse(t.itinerary || '[]'));
          setIncludes(JSON.parse(t.includes || '[]'));
          setExcludes(JSON.parse(t.excludes || '[]'));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field: string, value: string | boolean) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tours/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priceAdult: parseFloat(form.priceAdult), priceChild: parseFloat(form.priceChild), discount: parseFloat(form.discount), maxSlot: parseInt(form.maxSlot), minPax: parseInt(form.minPax), itinerary, includes, excludes }),
      });
      const data = await res.json();
      if (data.success) router.push('/admin/tours');
      else setError(data.error || 'Gagal menyimpan');
    } catch { setError('Terjadi kesalahan'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tours" className="text-gray-500 hover:text-gray-700">← Kembali</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Paket Tour</h1>
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
              {(Object.keys(TourCategoryLabels) as TourCategory[]).map(cat => <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinasi</label>
            <input type="text" required value={form.destination} onChange={e => updateField('destination', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
            <input type="text" required value={form.duration} onChange={e => updateField('duration', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
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
            <input type="text" value={form.coverImg} onChange={e => updateField('coverImg', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.isActive ? 'true' : 'false'} onChange={e => updateField('isActive', e.target.value === 'true')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <Link href="/admin/tours" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Batal</Link>
        </div>
      </form>
    </div>
  );
}
