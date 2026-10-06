'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AIRPORT_TRANSFER_RATES,
  TRANSFER_MAX_PAX,
  getTransferPrice,
  HAYBALI_BRAND,
  waLink,
} from '@/lib/haybali';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';

const TRANSFER_TOUR_SLUG = 'antar-jemput-bandara-bali';

/**
 * Form booking cepat antar-jemput bandara:
 * pilih area & jumlah penumpang → harga tampil langsung → lanjut ke
 * halaman booking resmi (tanggal & data pemesan dilengkapi di sana).
 */
export default function TransferQuickForm() {
  const router = useRouter();
  const [area, setArea] = useState('');
  const [direction, setDirection] = useState<'PICKUP' | 'DROP'>('PICKUP');
  const [pax, setPax] = useState(1);

  const rate = useMemo(() => AIRPORT_TRANSFER_RATES.find((r) => r.area === area), [area]);
  const price = useMemo(() => (area ? getTransferPrice(area, pax) : null), [area, pax]);
  const tierLabel = pax <= 5 ? '1-5 orang' : '6-10 orang';
  const tierUnavailable = rate && pax >= 6 && rate.priceBig === null;

  const handleSubmit = () => {
    if (!area || tierUnavailable) return;
    router.push(
      `/tours/${TRANSFER_TOUR_SLUG}/booking?area=${encodeURIComponent(area)}&direction=${direction}&pax=${pax}`
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Cek Harga & Booking Cepat</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arah Perjalanan</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('PICKUP')}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                direction === 'PICKUP'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🛬 Jemput di Bandara
            </button>
            <button
              type="button"
              onClick={() => setDirection('DROP')}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                direction === 'DROP'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🛫 Antar ke Bandara
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area / Tujuan</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">— Pilih area —</option>
            {AIRPORT_TRANSFER_RATES.map((r) => (
              <option key={r.area} value={r.area}>
                {r.area}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Penumpang ({tierLabel})
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPax((p) => Math.max(1, p - 1))}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-lg font-semibold"
              aria-label="Kurangi penumpang"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={TRANSFER_MAX_PAX}
              value={pax}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10);
                if (!isNaN(num)) setPax(Math.min(TRANSFER_MAX_PAX, Math.max(1, num)));
              }}
              className="w-full px-3 py-2.5 border-y border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setPax((p) => Math.min(TRANSFER_MAX_PAX, p + 1))}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-lg font-semibold"
              aria-label="Tambah penumpang"
            >
              +
            </button>
          </div>
          {rate && pax >= 6 && rate.priceBig === null && (
            <p className="text-amber-600 text-xs mt-1.5">
              Area ini hanya melayani 1-5 penumpang. Untuk rombongan, silakan hubungi kami via WhatsApp.
            </p>
          )}
        </div>

        {price !== null && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-blue-800">Estimasi Harga ({tierLabel})</span>
            <span className="text-xl font-bold text-blue-700">{formatCurrency(price)}</span>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          variant="accent"
          size="lg"
          fullWidth
          disabled={!area || tierUnavailable}
        >
          Lanjut Booking →
        </Button>
        <Button
          href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya tarif antar-jemput bandara.`)}
          variant="outline"
          fullWidth
          target="_blank"
        >
          Tanya Harga via WhatsApp
        </Button>
      </div>
    </div>
  );
}
