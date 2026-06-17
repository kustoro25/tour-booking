'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface TourSlot {
  id: string;
  tourId: string;
  date: string;
  quota: number;
  bookedCount: number;
  priceOverride: number | null;
  isBlackout: boolean;
}

export default function AdminSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tourId } = use(params);
  const [slots, setSlots] = useState<TourSlot[]>([]);
  const [tourName, setTourName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingSlot, setEditingSlot] = useState<TourSlot | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formQuota, setFormQuota] = useState('15');
  const [formPrice, setFormPrice] = useState('');
  const [formBlackout, setFormBlackout] = useState(false);

  useEffect(() => {
    fetchTour();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [viewMonth]);

  const fetchTour = async () => {
    const res = await fetch(`/api/admin/tours/${tourId}`);
    const data = await res.json();
    if (data.success) setTourName(data.data.name);
  };

  const fetchSlots = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/tours/${tourId}/slots?month=${viewMonth}`);
    const data = await res.json();
    if (data.success) setSlots(data.data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingSlot(null);
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormQuota('15');
    setFormPrice('');
    setFormBlackout(false);
  };

  const openEdit = (slot: TourSlot) => {
    setEditingSlot(slot);
    setFormDate(slot.date.split('T')[0]);
    setFormQuota(String(slot.quota));
    setFormPrice(slot.priceOverride !== null ? String(slot.priceOverride) : '');
    setFormBlackout(slot.isBlackout);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;
    setMessage('');

    const res = await fetch(`/api/admin/tours/${tourId}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formDate,
        quota: parseInt(formQuota),
        priceOverride: formPrice ? parseFloat(formPrice) : null,
        isBlackout: formBlackout,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setFormDate('');
      setFormQuota('15');
      setFormPrice('');
      setFormBlackout(false);
      setEditingSlot(null);
      fetchSlots();
      setMessage('Slot berhasil disimpan');
    } else {
      setMessage(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Hapus slot ini?')) return;
    await fetch(`/api/admin/tours/${tourId}/slots`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    });
    fetchSlots();
  };

  const changeMonth = (offset: number) => {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal & Kuota</h1>
          {tourName && <p className="text-sm text-gray-500 mt-1">{tourName}</p>}
        </div>
        <Link href="/admin/tours" className="text-sm text-blue-600 hover:text-blue-700">
          ← Kembali ke Daftar Paket
        </Link>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-4 mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-900">
          {new Date(viewMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {editingSlot ? 'Edit Slot' : 'Tambah Slot Baru'}
          </h2>
          {!editingSlot && (
            <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + Tambah Slot
            </button>
          )}
        </div>

        {(editingSlot || formDate) && (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kuota</label>
              <input
                type="number"
                value={formQuota}
                onChange={(e) => setFormQuota(e.target.value)}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Khusus (Rp)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="Kosongkan jika pakai default"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formBlackout}
                  onChange={(e) => setFormBlackout(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Blackout</span>
              </label>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 mb-0.5">
                Simpan
              </button>
              <button
                type="button"
                onClick={() => { setEditingSlot(null); setFormDate(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 mb-0.5"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-3 text-sm ${message.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Slots List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                <th className="px-4 py-3 text-center font-medium">Kuota</th>
                <th className="px-4 py-3 text-center font-medium">Terbooking</th>
                <th className="px-4 py-3 text-center font-medium">Tersedia</th>
                <th className="px-4 py-3 text-right font-medium">Harga Khusus</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat...</td></tr>
              ) : slots.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Belum ada slot untuk bulan ini. Klik "+ Tambah Slot" untuk menambah.
                </td></tr>
              ) : (
                slots.map((slot) => {
                  const available = Math.max(0, slot.quota - slot.bookedCount);
                  const isFull = available <= 0;
                  const isLow = available <= 3 && available > 0;
                  return (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{formatDate(slot.date)}</td>
                      <td className="px-4 py-3 text-center">{slot.quota}</td>
                      <td className="px-4 py-3 text-center">{slot.bookedCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          isFull ? 'bg-red-100 text-red-700' :
                          isLow ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {available} seat
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {slot.priceOverride ? `Rp ${slot.priceOverride.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          slot.isBlackout ? 'bg-gray-300 text-gray-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {slot.isBlackout ? 'Blackout' : 'Tersedia'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(slot)} className="text-blue-600 hover:text-blue-700 text-xs">Edit</button>
                          <button onClick={() => handleDelete(slot.id)} className="text-red-600 hover:text-red-700 text-xs">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
