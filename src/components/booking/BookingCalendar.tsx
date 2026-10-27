'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/** Format tanggal lokal sebagai YYYY-MM-DD. Gunakan ini, bukan toISOString(),
 *  karena toISOString() menggeser satu hari untuk zona waktu positif (WIB/UTC+7). */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface Slot {
  date: string;
  quota: number;
  bookedCount: number;
  isBlackout: boolean;
  priceOverride: number | null;
}

interface BookingCalendarProps {
  tourId: string;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export default function BookingCalendar({ tourId, onDateSelect, selectedDate }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/slots?month=${year}-${String(month + 1).padStart(2, '0')}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [year, month, tourId]);

  const getSlotForDate = (date: Date): Slot | undefined => {
    const dateStr = toLocalDateStr(date);
    return slots.find((s) => s.date.startsWith(dateStr));
  };

  const getDayClass = (date: Date, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return 'text-mist-dim cursor-default pointer-events-none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return 'text-mist-dim cursor-not-allowed';

    const slot = getSlotForDate(date);
    const dateStr = toLocalDateStr(date);
    const isSelected = selectedDate === dateStr;

    if (slot?.isBlackout) return 'bg-red-500/15 text-red-500 cursor-not-allowed';
    if (slot && slot.bookedCount >= slot.quota) return 'bg-red-500/15 text-red-500 cursor-not-allowed';
    if (isSelected) return 'bg-gold-400 text-ink-950 font-bold cursor-pointer shadow-md ring-2 ring-gold-400';

    const remaining = slot ? slot.quota - slot.bookedCount : 15;
    if (remaining <= 3 && remaining > 0) return 'bg-gold-400/15 text-gold-200 font-semibold cursor-pointer hover:bg-gold-400/25 hover:text-gold-200';

    return 'bg-green-500/15 text-green-200 font-medium cursor-pointer hover:bg-green-500/25 hover:text-green-200';
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    const slot = getSlotForDate(date);
    if (slot?.isBlackout) return;
    if (slot && slot.bookedCount >= slot.quota) return;

    const dateStr = toLocalDateStr(date);
    onDateSelect?.(dateStr);
  };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="bg-ink-850 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="w-9 h-9 flex items-center justify-center hover:bg-ink-800 rounded-lg text-mist hover:text-gold-300 transition-colors"
          disabled={loading}
          aria-label="Bulan sebelumnya"
        >
          ←
        </button>
        <h4 className="font-semibold text-ivory text-sm">
          {monthNames[month]} {year}
        </h4>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="w-9 h-9 flex items-center justify-center hover:bg-ink-800 rounded-lg text-mist hover:text-gold-300 transition-colors"
          disabled={loading}
          aria-label="Bulan berikutnya"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`hdr-${i}`} className="h-6 w-full rounded" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-mist-dim py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-9 sm:h-10" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(year, month, i + 1);
              const slot = getSlotForDate(date);
              const remaining = slot ? slot.quota - slot.bookedCount : 15;
              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(date)}
                  disabled={getDayClass(date, true).includes('cursor-not-allowed')}
                  className={`h-9 sm:h-10 rounded text-xs font-medium flex flex-col items-center justify-center transition-colors ${getDayClass(date, true)}`}
                  title={slot && remaining <= 3 && remaining > 0 ? `Tersisa ${remaining} seat` : ''}
                >
                  {i + 1}
                  {slot && remaining <= 3 && remaining > 0 && (
                    <span className="text-[9px] leading-tight">{remaining}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-ink-700 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mist">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-green-500/15 border border-green-500/40 rounded flex-shrink-0" />
              <span>Tersedia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-gold-400/15 border border-gold-400/40 rounded flex-shrink-0" />
              <span>Hampir Penuh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-red-500/15 border border-red-500/40 rounded flex-shrink-0" />
              <span>Penuh</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
