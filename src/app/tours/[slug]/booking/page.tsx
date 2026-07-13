'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { Skeleton } from '@/components/ui/Skeleton';

interface Tour {
  id: string;
  name: string;
  slug: string;
  priceAdult: number;
  priceChild: number;
  discount: number;
  minPax: number;
  duration: string;
  destination: string;
}

interface SlotInfo {
  quota: number;
  bookedCount: number;
  isBlackout: boolean;
  priceOverride: number | null;
}

type PaymentType = 'FULL' | 'INSTALLMENT';

const INSTALLMENT_OPTIONS = [2, 3, 4, 6];
const DP_PERCENTAGE = 30;

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    adults: 1,
    children: 0,
    notes: '',
  });
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<number[]>([2, 3, 4, 6]);
  const [dpPercentage, setDpPercentage] = useState(30);
  const [minInstallmentAmount, setMinInstallmentAmount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ invoiceNo: string } | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [slotLoading, setSlotLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/tours/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTour(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch installment settings
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setInstallmentEnabled(data.data.installment_enabled === true);
          if (data.data.installment_options && Array.isArray(data.data.installment_options)) {
            setInstallmentOptions(data.data.installment_options);
            if (data.data.installment_options.length > 0) {
              setInstallmentCount(data.data.installment_options[0]);
            }
          }
          if (typeof data.data.dp_percentage === 'number') {
            setDpPercentage(data.data.dp_percentage);
          }
          if (typeof data.data.min_amount_for_installment === 'number') {
            setMinInstallmentAmount(data.data.min_amount_for_installment);
          }
        }
      })
      .catch(() => {
        // Default: disabled
      });
  }, [slug]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setErrors({});
    if (!tour?.id) return;

    setSlotLoading(true);
    try {
      const res = await fetch(`/api/tours/${tour.id}/slots?month=${date.substring(0, 7)}`);
      const data = await res.json();
      if (data.success) {
        const slot = (data.data || []).find(
          (s: SlotInfo & { date: string }) => s.date.startsWith(date)
        );
        setSlotInfo(slot || null);
      }
    } catch {
      setSlotInfo(null);
    } finally {
      setSlotLoading(false);
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!selectedDate) errs.date = 'Silakan pilih tanggal keberangkatan';
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.customerName || formData.customerName.trim().length < 3) errs.customerName = 'Nama lengkap minimal 3 karakter';
    if (!formData.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) errs.customerEmail = 'Format email tidak valid';
    if (!formData.customerPhone || !/^\+?[\d\s-]{8,15}$/.test(formData.customerPhone)) errs.customerPhone = 'Nomor HP tidak valid (min. 8 digit, gunakan angka)';
    if (formData.adults < 1) errs.adults = 'Minimal 1 peserta dewasa';
    if (formData.children < 0) errs.children = 'Jumlah anak tidak valid';
    if (tour && formData.adults + formData.children < tour.minPax) errs.adults = `Minimal ${tour.minPax} peserta total`;
    return errs;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      setStep(2);
    } else if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!tour?.id || !selectedDate) {
      setErrors({ submit: 'Data tour atau tanggal belum lengkap. Silakan muat ulang halaman.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          tourDate: selectedDate,
          ...formData,
          paymentType,
          installmentCount: paymentType === 'INSTALLMENT' ? installmentCount : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setStep(5);
      } else {
        if (data.errors && typeof data.errors === 'object') {
          setErrors((prev) => ({ ...prev, ...data.errors }));
        } else {
          setErrors({ submit: data.error || data.message || 'Gagal membuat booking' });
        }
      }
    } catch {
      setErrors({ submit: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-5 w-48 mx-auto" />
          <div className="max-w-md mx-auto">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-40 ml-auto" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Paket tidak ditemukan</h2>
        <Button href="/tours" variant="primary">Lihat Paket Lain</Button>
      </div>
    );
  }

  const total = tour.priceAdult * formData.adults + tour.priceChild * formData.children;
  const grandTotal = total - total * (tour.discount / 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Booking Steps Progress */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Pilih Tanggal', 'Isi Data', 'Metode Bayar', 'Konfirmasi'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${step >= i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Select Date */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Tanggal Keberangkatan</h2>
          <p className="text-gray-500 text-sm mb-6">{tour.name} &bull; {tour.duration}</p>

          {/* Calendar */}
          <div className="max-w-md mx-auto">
            <BookingCalendar
              tourId={tour.id}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Slot Info Card */}
          {selectedDate && (
            <div className="mt-4 max-w-md mx-auto">
              {slotLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 p-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
                  Mengecek ketersediaan...
                </div>
              ) : (
                <div
                  className={`rounded-xl p-4 border ${
                    slotInfo?.isBlackout
                      ? 'bg-red-50 border-red-200'
                      : slotInfo && slotInfo.bookedCount >= slotInfo.quota
                      ? 'bg-red-50 border-red-200'
                      : slotInfo && slotInfo.quota - slotInfo.bookedCount <= 3
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  {slotInfo?.isBlackout ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🚫</span>
                        <span className="font-semibold text-red-700">Tanggal Tidak Tersedia</span>
                      </div>
                      <p className="text-sm text-red-600">
                        Tanggal ini tidak menerima booking. Silakan pilih tanggal lain.
                      </p>
                    </>
                  ) : slotInfo && slotInfo.bookedCount >= slotInfo.quota ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">😞</span>
                        <span className="font-semibold text-red-700">Slot Penuh</span>
                      </div>
                      <p className="text-sm text-red-600">
                        Semua {slotInfo.quota} kursi telah dipesan. Silakan pilih tanggal lain.
                      </p>
                    </>
                  ) : slotInfo ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {slotInfo.quota - slotInfo.bookedCount <= 3 ? '⚠️' : '✅'}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {slotInfo.quota - slotInfo.bookedCount <= 3
                                ? 'Hampir Penuh'
                                : 'Tersedia'}
                            </span>
                            <p className="text-sm text-gray-600">
                              {slotInfo.quota - slotInfo.bookedCount} dari {slotInfo.quota} kursi tersisa
                            </p>
                          </div>
                        </div>
                        {slotInfo.priceOverride && (
                          <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                            {formatCurrency(slotInfo.priceOverride)}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            slotInfo.quota - slotInfo.bookedCount <= 3
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${(slotInfo.bookedCount / slotInfo.quota) * 100}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">✅</span>
                        <span className="font-semibold text-green-700">Kuota Default</span>
                      </div>
                      <p className="text-sm text-green-600">
                        15 kursi tersedia — belum ada pemesanan untuk tanggal ini.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.date && (
            <p className="text-red-500 text-sm text-center mt-3">{errors.date}</p>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleNext} variant="primary">
              Lanjutkan →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Data */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Isi Data Diri & Peserta</h2>
          <p className="text-gray-500 text-sm mb-6">Lengkapi data berikut untuk melanjutkan booking</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.customerEmail && <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dewasa</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-semibold"
                    aria-label="Kurangi dewasa"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={formData.adults}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        updateField('adults', 0);
                      } else {
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) updateField('adults', num);
                      }
                    }}
                    className="w-full px-3 py-2.5 border-y border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('adults', formData.adults + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-semibold"
                    aria-label="Tambah dewasa"
                  >
                    +
                  </button>
                </div>
                {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Anak</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('children', Math.max(0, formData.children - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-semibold"
                    aria-label="Kurangi anak"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={formData.children}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        updateField('children', 0);
                      } else {
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) updateField('children', num);
                      }
                    }}
                    className="w-full px-3 py-2.5 border-y border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('children', formData.children + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-lg font-semibold"
                    aria-label="Tambah anak"
                  >
                    +
                  </button>
                </div>
                {errors.children && <p className="text-red-500 text-sm mt-1">{errors.children}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Khusus (Opsional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Ada permintaan khusus? Tulis di sini..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(1)} variant="outline">← Kembali</Button>
            <Button onClick={handleNext} variant="primary">Lanjutkan →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Method */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Metode Pembayaran</h2>
          <p className="text-gray-500 text-sm mb-6">Pilih cara pembayaran yang sesuai untuk Anda</p>

          <div className="space-y-4 mb-6">
            {/* Full Payment */}
            <div
              onClick={() => setPaymentType('FULL')}
              className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                paymentType === 'FULL'
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentType === 'FULL' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {paymentType === 'FULL' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Pembayaran Lunas</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Bayar penuh sekarang sebesar <strong className="text-gray-700">{formatCurrency(grandTotal)}</strong></p>
                </div>
              </div>
            </div>

            {/* Installment Payment */}
            <div
              onClick={() => setPaymentType('INSTALLMENT')}
              className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                paymentType === 'INSTALLMENT'
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentType === 'INSTALLMENT' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {paymentType === 'INSTALLMENT' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Pembayaran Angsuran (Cicilan)</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Bayar dengan DP {dpPercentage}% dan sisanya dicicil sesuai pilihan Anda</p>
                  {!installmentEnabled && (
                    <p className="text-xs text-amber-600 mt-1">⚠ Fitur ini mungkin belum diaktifkan oleh admin. Booking akan gagal jika fitur tidak tersedia.</p>
                  )}
                </div>
              </div>

                {paymentType === 'INSTALLMENT' && (
                  <div className="mt-4 ml-9 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Angsuran</label>
                      <div className="flex flex-wrap gap-2">
                        {installmentOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setInstallmentCount(opt); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              installmentCount === opt
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {opt}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Installment simulation */}
                    {(() => {
                      const dp = Math.round(grandTotal * (dpPercentage / 100));
                      const remaining = grandTotal - dp;
                      const perInstallment = Math.round(remaining / installmentCount);
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-gray-700">Simulasi Angsuran</h4>
                          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                            <span className="text-gray-500">Total Harga</span>
                            <span className="text-right font-medium">{formatCurrency(grandTotal)}</span>
                            <span className="text-gray-500">DP ({dpPercentage}%)</span>
                            <span className="text-right font-medium text-orange-600">{formatCurrency(dp)}</span>
                            <span className="text-gray-500">Sisa</span>
                            <span className="text-right font-medium">{formatCurrency(remaining)}</span>
                            <span className="text-gray-500 pt-2 border-t">Angsuran / Bulan</span>
                            <span className="text-right font-bold text-blue-600 pt-2 border-t">{installmentCount}x {formatCurrency(perInstallment)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(2)} variant="outline">← Kembali</Button>
            <Button onClick={handleNext} variant="primary">Lanjutkan →</Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Pemesanan</h2>

          <div className="border rounded-lg p-4 space-y-3 bg-gray-50 mb-6">
            <div>
              <span className="text-sm text-gray-500">Paket Tour</span>
              <p className="font-semibold text-gray-900">{tour.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Tanggal</span>
                <p className="font-medium">{formatDate(selectedDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Peserta</span>
                <p className="font-medium">{formData.adults} Dewasa{formData.children > 0 ? `, ${formData.children} Anak` : ''}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Nama Pemesan</span>
              <p className="font-medium">{formData.customerName}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium text-sm break-all">{formData.customerEmail}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">No. HP</span>
                <p className="font-medium">{formData.customerPhone}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Metode Pembayaran</span>
              <p className="font-medium">
                {paymentType === 'FULL' ? 'Pembayaran Lunas' : `Angsuran ${installmentCount}x`}
              </p>
            </div>
            {paymentType === 'INSTALLMENT' && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm font-medium text-blue-800">Detail Angsuran:</p>
                <p className="text-xs text-blue-600 mt-1">
                  DP {dpPercentage}%: {formatCurrency(Math.round(grandTotal * (dpPercentage / 100)))} &bull; Sisa {installmentCount}x @ {formatCurrency(Math.round((grandTotal - Math.round(grandTotal * (dpPercentage / 100))) / installmentCount))}/bulan
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Harga Dewasa ({formData.adults} x {formatCurrency(tour.priceAdult)})</span>
              <span>{formatCurrency(tour.priceAdult * formData.adults)}</span>
            </div>
            {formData.children > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga Anak ({formData.children} x {formatCurrency(tour.priceChild)})</span>
                <span>{formatCurrency(tour.priceChild * formData.children)}</span>
              </div>
            )}
            {tour.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon ({tour.discount}%)</span>
                <span>-{formatCurrency(total * (tour.discount / 100))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(3)} variant="outline">← Kembali</Button>
            <Button onClick={handleSubmit} variant="accent" size="lg" isLoading={submitting}>
              Booking Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Success / Invoice */}
      {step === 5 && bookingResult && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Berhasil!</h2>
          <p className="text-gray-500 mb-6">
            Invoice Anda telah diterbitkan. Silakan lakukan pembayaran sesuai instruksi yang tertera.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-500 mb-1">Nomor Invoice</p>
            <p className="text-2xl font-bold text-blue-600">{bookingResult.invoiceNo}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button href={`/invoice/${bookingResult.invoiceNo}`} variant="primary">
              Lihat Invoice
            </Button>
            <Button href="/tours" variant="outline">
              Lihat Paket Lain
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
