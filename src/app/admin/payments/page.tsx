'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminRole } from '@/lib/useAdminRole';

type PaymentGatewayMode = 'manual' | 'midtrans';

interface ModeOption {
  value: PaymentGatewayMode;
  title: string;
  icon: string;
  desc: string;
  points: string[];
  activeClass: string;
  badge: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'manual',
    title: 'Transfer Manual',
    icon: '🏦',
    desc: 'Customer transfer ke rekening bank, lalu konfirmasi ke admin melalui WhatsApp.',
    points: [
      'Status pembayaran diaktifkan manual oleh admin',
      'Admin mengecek mutasi/bukti transfer lalu klik Konfirmasi Pembayaran di detail booking',
      'Tidak membutuhkan kredensial payment gateway',
      'Rekening tujuan diatur di Pengaturan → Rekening Bank',
    ],
    activeClass: 'border-blue-500 ring-2 ring-blue-200 shadow-md',
    badge: 'bg-blue-600',
  },
  {
    value: 'midtrans',
    title: 'Payment Gateway (Midtrans)',
    icon: '⚡',
    desc: 'Sistem otomatis: customer bayar online (QRIS, Virtual Account, e-wallet, kartu), status terkonfirmasi sendiri.',
    points: [
      'Status pembayaran aktif otomatis via webhook Midtrans',
      'Tanpa konfirmasi manual dari admin',
      'Mendukung QRIS, Virtual Account bank, GoPay, ShopeePay, DANA, kartu kredit/debit',
      'Kredensial diatur di environment variables (MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY)',
    ],
    activeClass: 'border-emerald-500 ring-2 ring-emerald-200 shadow-md',
    badge: 'bg-emerald-600',
  },
];

export default function AdminPaymentsPage() {
  const { isSuperAdmin, role, loading: roleLoading } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<PaymentGatewayMode | null>(null);
  const [savedMode, setSavedMode] = useState<PaymentGatewayMode | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          // payment_gateway_effective = mode yang benar-benar aktif (DB → env → manual)
          const current = data.data.payment_gateway_effective === 'midtrans' ? 'midtrans' : 'manual';
          setSavedMode(current as PaymentGatewayMode);
          setMode(current as PaymentGatewayMode);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!mode) return;
    if (!isSuperAdmin) {
      setShowBlocked(true);
      setTimeout(() => setShowBlocked(false), 3000);
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_gateway: mode }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMode(mode);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pembayaran</h1>
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">💰 Metode Pembayaran</h1>
      <p className="text-sm text-gray-500 mb-6">
        Pilih bagaimana pembayaran customer diproses. Hanya satu metode yang aktif pada satu waktu.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {MODE_OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => !roleLoading && setMode(opt.value)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer bg-white ${
                active ? opt.activeClass : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Badge mode tersimpan (AKTIF) vs pilihan yang belum disimpan */}
              {savedMode === opt.value && (
                <span className={`absolute -top-3 right-4 text-xs font-semibold text-white px-3 py-1 rounded-full ${opt.badge}`}>
                  ✓ AKTIF
                </span>
              )}
              {savedMode !== opt.value && mode === opt.value && (
                <span className="absolute -top-3 right-4 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                  Dipilih — belum disimpan
                </span>
              )}

              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{opt.icon}</span>
                <h2 className="text-lg font-semibold text-gray-900">{opt.title}</h2>
                {/* Radio indikator pilihan */}
                <span
                  className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    active ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{opt.desc}</p>

              <ul className="space-y-1.5">
                {opt.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Catatan tambahan */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Catatan:</strong> badge ✓ AKTIF menunjukkan mode yang sedang berlaku.
          Pilih mode lain lalu klik <strong>Simpan Metode Pembayaran</strong> untuk menggantinya.
          Setting ini menang atas environment variable <code>PAYMENT_GATEWAY</code>.
          Mode Midtrans mengikuti <code>MIDTRANS_IS_PRODUCTION</code> (false = sandbox, true = production).
          Rekening bank untuk mode Transfer Manual dikelola di{' '}
          <Link href="/admin/settings" className="text-blue-600 hover:underline font-medium">
            Pengaturan → Rekening Bank
          </Link>.
          Pesanan yang belum dibayar tetap otomatis dibatalkan sistem setelah 24 jam di kedua mode.
        </p>
      </div>

      {/* Save */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || roleLoading || !mode}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Metode Pembayaran'}
        </button>
        {mode !== null && mode !== savedMode && !saving && (
          <span className="text-amber-600 text-sm font-medium animate-fade-in">
            ⚠️ Perubahan belum disimpan
          </span>
        )}
        {saved && (
          <span className="text-green-600 text-sm font-medium animate-fade-in">
            ✅ Metode pembayaran disimpan!
          </span>
        )}
        {showBlocked && (
          <span className="text-red-600 text-sm font-medium animate-fade-in">
            {role === 'CONTENT_MANAGER'
              ? '🚫 Hanya Super Admin yang bisa mengubah metode pembayaran. Hubungi Admin Operasional untuk bantuan.'
              : '🚫 Hanya Super Admin yang bisa mengubah metode pembayaran.'}
          </span>
        )}
      </div>
    </div>
  );
}
