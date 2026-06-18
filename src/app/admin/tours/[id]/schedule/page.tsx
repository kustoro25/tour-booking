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
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [editingSlot, setEditingSlot] = useState<TourSlot | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formQuota, setFormQuota] = useState('15');
  const [formPrice, setFormPrice] = useState('');
  const [formBlackout, setFormBlackout] = useState(false);
  const [batchDates, setBatchDates] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetch('/api/admin/tours/' + tourId)
      .then(r => r.json())
      .then(d => { if (d.success) setTourName(d.data.name); });
  }, [tourId]);

  useEffect(() => {
    fetchSlots();
  }, [viewYear, viewMonth]);

  const fetchSlots = async () => {
    setLoading(true);
    const m = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const res = await fetch(`/api/admin/tours/${tourId}/slots?month=${m}`);
    const data = await res.json();
    if (data.success) setSlots(data.data || []);
    setLoading(false);
  };

  const openAdd = (date?: string) => {
    setEditingSlot(null);
    setBatchMode(false);
    const d = date || new Date().toISOString().split('T')[0];
    setFormDate(d);
    setFormQuota('15');
    setFormPrice('');
    setFormBlackout(false);
  };

  const openBatch = () => {
    setEditingSlot(null);
    setBatchMode(true);
    setBatchDates('');
  };

  const openEdit = (slot: TourSlot) => {
    setEditingSlot(slot);
    setBatchMode(false);
    setFormDate(slot.date.split('T')[0]);
    setFormQuota(String(slot.quota));
    setFormPrice(slot.priceOverride !== null ? String(slot.priceOverride) : '');
    setFormBlackout(slot.isBlackout);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (batchMode) {
      // Batch mode: parse multiple dates
      const dates = batchDates
        .split(/[\n,;]+/)
        .map(d => d.trim())
        .filter(d => d && !isNaN(Date.parse(d)));

      if (dates.length === 0) {
        setMessage('Masukkan minimal 1 tanggal valid (format YYYY-MM-DD)');
        return;
      }

      let ok = 0;
      for (const date of dates) {
        const res = await fetch(`/api/admin/tours/${tourId}/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            quota: parseInt(formQuota) || 15,
            priceOverride: formPrice ? parseFloat(formPrice) : null,
            isBlackout: formBlackout,
          }),
        });
        const data = await res.json();
        if (data.success) ok++;
      }
      setBatchDates('');
      setBatchMode(false);
      fetchSlots();
      setMessage(`${ok} dari ${dates.length} slot berhasil disimpan`);
    } else {
      if (!formDate) return;
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
    let m = viewMonth + offset;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const changeYear = (offset: number) => {
    setViewYear(y => y + offset);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const slotMap = new Map<string, TourSlot>();
  slots.forEach(s => {
    const key = s.date.split('T')[0];
    slotMap.set(key, s);
  });

  const calendarCells: { day: number; date: string; slot?: TourSlot; isPast: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fill leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ day: 0, date: '', isPast: false });
  }
  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cellDate = new Date(viewYear, viewMonth, d);
    cellDate.setHours(0, 0, 0, 0);
    calendarCells.push({
      day: d,
      date: dateStr,
      slot: slotMap.get(dateStr),
      isPast: cellDate < today,
    });
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Month/Year Navigator */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => changeYear(-1)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Tahun sebelumnya">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900">{monthNames[viewMonth]} {viewYear}</span>
                <button onClick={() => changeYear(1)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Tahun berikutnya">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {dayNames.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, i) => {
                  if (cell.day === 0) {
                    return <div key={`empty-${i}`} className="aspect-square bg-gray-50/50" />;
                  }

                  const slot = cell.slot;
                  const isSelected = cell.date === selectedDate;
                  let cellClass = 'aspect-square p-1 border border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors relative group';
                  let bgClass = '';
                  let textClass = 'font-semibold';
                  let indicator = null;

                  if (cell.isPast) {
                    textClass = 'text-gray-300';
                    cellClass += ' cursor-default';
                  } else if (slot?.isBlackout) {
                    bgClass = 'bg-gray-100';
                    textClass = 'text-gray-500';
                    indicator = <div className="w-2 h-2 rounded-full bg-gray-400 mx-auto mt-0.5" />;
                  } else if (slot && slot.bookedCount >= slot.quota) {
                    bgClass = 'bg-red-50';
                    textClass = 'text-red-600';
                    indicator = <div className="w-2 h-2 rounded-full bg-red-400 mx-auto mt-0.5" />;
                  } else if (slot) {
                    const remaining = slot.quota - slot.bookedCount;
                    if (remaining <= 3) {
                      bgClass = 'bg-amber-50';
                      textClass = 'text-amber-700';
                      indicator = <div className="w-2 h-2 rounded-full bg-amber-400 mx-auto mt-0.5" />;
                    } else {
                      bgClass = 'bg-green-50';
                      textClass = 'text-green-700';
                      indicator = <div className="w-2 h-2 rounded-full bg-green-400 mx-auto mt-0.5" />;
                    }
                  }

                  if (isSelected) {
                    cellClass += ' ring-2 ring-blue-500 z-10 rounded-lg';
                  }

                  return (
                    <div
                      key={cell.date}
                      className={`${cellClass} ${bgClass} ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        if (cell.isPast) return;
                        setSelectedDate(cell.date);
                        if (slot) openEdit(slot);
                        else openAdd(cell.date);
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm ${textClass}`}>{cell.day}</span>
                        {indicator}
                        {slot && !slot.isBlackout && (
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {slot.bookedCount}/{slot.quota}
                          </span>
                        )}
                      </div>
                      {/* Hover tooltip */}
                      {slot && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                          {slot.isBlackout ? 'Blackout' : `${slot.bookedCount}/${slot.quota} terbooking`}
                          {slot.priceOverride ? ` · Rp${slot.priceOverride.toLocaleString('id-ID')}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Tersedia</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Hampir Penuh</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Penuh</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Blackout</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Add/Edit Form */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              {editingSlot ? 'Edit Slot' : batchMode ? 'Tambah Batch' : 'Tambah Slot'}
            </h2>

            {/* Mode toggle */}
            {!editingSlot && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setBatchMode(false); setFormDate(''); }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!batchMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Single
                </button>
                <button onClick={openBatch}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${batchMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Batch
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {batchMode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal (batch)</label>
                  <textarea
                    value={batchDates}
                    onChange={e => setBatchDates(e.target.value)}
                    rows={4}
                    placeholder={`Masukkan tanggal, pisahkan dengan koma atau enter:\n2026-07-01\n2026-07-02\n2026-07-03`}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kuota</label>
                <input
                  type="number"
                  value={formQuota}
                  onChange={e => setFormQuota(e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Khusus (Rp)</label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  placeholder="Kosongkan jika pakai default"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formBlackout}
                  onChange={e => setFormBlackout(e.target.checked)}
                  className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Blackout (tanggal tidak tersedia)</span>
              </label>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  {editingSlot ? 'Update' : `Simpan ${batchMode ? 'Batch' : ''}`}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingSlot(null); setBatchMode(false); setFormDate(''); setSelectedDate(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>

            {message && (
              <p className={`mt-3 text-sm ${message.includes('berhasil') || message.includes('disimpan') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>

          {/* Slot List Table */}
          <div className="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-medium text-sm text-gray-700">Daftar Slot ({slots.length})</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {slots.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">Belum ada slot bulan ini</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Tanggal</th>
                      <th className="px-3 py-2 text-center">Sisa</th>
                      <th className="px-3 py-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {slots.map(slot => {
                      const remaining = Math.max(0, slot.quota - slot.bookedCount);
                      const isFull = remaining <= 0;
                      return (
                        <tr key={slot.id} className={`hover:bg-gray-50 cursor-pointer ${slot.date.split('T')[0] === selectedDate ? 'bg-blue-50' : ''}`}
                          onClick={() => { setSelectedDate(slot.date.split('T')[0]); openEdit(slot); }}>
                          <td className="px-3 py-2">
                            <span className="font-medium">{formatDate(slot.date)}</span>
                            {slot.isBlackout && <span className="ml-1 text-gray-400">[Blackout]</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              isFull ? 'bg-red-100 text-red-700' :
                              remaining <= 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {remaining}/{slot.quota}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                              className="text-red-500 hover:text-red-700 text-[10px]">Hapus</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
