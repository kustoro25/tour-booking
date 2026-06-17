'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchSlots();
  }, [year, month, tourId]);

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

  const getSlotForDate = (date: Date): Slot | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.find((s) => s.date.startsWith(dateStr));
  };

  const getDayClass = (date: Date, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return 'text-gray-300 cursor-default';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return 'text-gray-300 cursor-not-allowed';

    const slot = getSlotForDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selectedDate === dateStr;

    if (slot?.isBlackout) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (slot && slot.bookedCount >= slot.quota) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (isSelected) return 'bg-orange-500 text-white font-bold cursor-pointer hover:bg-orange-600';

    const remaining = slot ? slot.quota - slot.bookedCount : 15;
    if (remaining <= 3 && remaining > 0) return 'bg-orange-100 text-orange-800 font-medium cursor-pointer hover:bg-orange-200';
    
    return 'bg-green-50 text-green-800 cursor-pointer hover:bg-green-100 hover:text-green-900';
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    const slot = getSlotForDate(date);
    if (slot?.isBlackout) return;
    if (slot && slot.bookedCount >= slot.quota) return;

    const dateStr = date.toISOString().split('T')[0];
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
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
          disabled={loading}
        >
          ←
        </button>
        <h4 className="font-semibold text-gray-900 text-sm">
          {monthNames[month]} {year}
        </h4>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
          disabled={loading}
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-9" />
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
                  className={`h-9 rounded text-xs font-medium flex flex-col items-center justify-center transition-colors ${getDayClass(date, true)}`}
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
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded flex-shrink-0" />
              <span>Tersedia</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded flex-shrink-0" />
              <span>Hampir Penuh</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded flex-shrink-0" />
              <span>Penuh</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
