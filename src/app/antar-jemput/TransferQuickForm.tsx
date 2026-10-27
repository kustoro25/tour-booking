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
export default function TransferQuickForm({ waNumber }: { waNumber?: string }) {
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
    <div className="bg-ink-850 rounded-2xl shadow-card p-6 border border-ink-700">
      <h3 className="text-lg font-bold text-ivory mb-4">Cek Harga & Booking Cepat</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-mist mb-1">Arah Perjalanan</label>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('PICKUP')}
              className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                direction === 'PICKUP'
                  ? 'border-gold-400 bg-gold-400/10 text-gold-200'
                  : 'border-ink-700 text-mist hover:border-ink-600'
              }`}
            >
              🛬 Jemput di Bandara
            </button>
            <button
              type="button"
              onClick={() => setDirection('DROP')}
              className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                direction === 'DROP'
                  ? 'border-gold-400 bg-gold-400/10 text-gold-200'
                  : 'border-ink-700 text-mist hover:border-ink-600'
              }`}
            >
              🛫 Antar ke Bandara
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-mist mb-1">Area / Tujuan</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
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
          <label className="block text-sm font-medium text-mist mb-1">
            Jumlah Penumpang ({tierLabel})
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPax((p) => Math.max(1, p - 1))}
              className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 text-lg font-semibold"
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
              className="w-full h-11 px-3 border-y border-ink-600 rounded-none text-center focus:ring-2 focus:ring-gold-400 focus:border-gold-400 focus:z-10 bg-ink-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setPax((p) => Math.min(TRANSFER_MAX_PAX, p + 1))}
              className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-r-xl bg-ink-900 text-mist hover:bg-ink-800 text-lg font-semibold"
              aria-label="Tambah penumpang"
            >
              +
            </button>
          </div>
          {rate && pax >= 6 && rate.priceBig === null && (
            <p className="text-gold-300 text-xs mt-1.5">
              Area ini hanya melayani 1-5 penumpang. Untuk rombongan, silakan hubungi kami via WhatsApp.
            </p>
          )}
        </div>

        {price !== null && (
          <div className="bg-gold-400/10 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-gold-200">Estimasi Harga ({tierLabel})</span>
            <span className="text-xl font-bold text-gold-200">{formatCurrency(price)}</span>
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
          href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya tarif antar-jemput bandara.`, waNumber)}
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
