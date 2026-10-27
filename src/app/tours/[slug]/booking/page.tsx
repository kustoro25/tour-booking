'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PICKUP_ZONES,
  STANDARD_AREAS,
  REMOTE_AREA_FEES,
  FLEET,
  AIRPORT_TRANSFER_RATES,
  TRANSFER_MAX_PAX,
  DRIVER_POLICY,
  WA_NUMBER,
  getPickupTimeOptions,
  getTransferPrice,
  getCarRentalBasePrice,
  calcCarRentalTotal,
  calcLatePickupFee,
  waBookingLink,
} from '@/lib/haybali';
import Button from '@/components/ui/Button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { Skeleton } from '@/components/ui/Skeleton';

interface Tour {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceAdult: number;
  priceChild: number;
  discount: number;
  minPax: number;
  maxSlot: number;
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

// Layanan khusus HAYBALI TRANS (sewa mobil & antar-jemput bandara)
type Direction = 'PICKUP' | 'DROP';

export default function BookingPageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12"><Skeleton className="h-64 w-full rounded-xl" /></div>}>
      <BookingPage />
    </Suspense>
  );
}

function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  // Prefill dari halaman /antar-jemput (form booking cepat): ?area=&direction=&pax=
  // State diinisialisasi langsung dari query string agar tidak perlu setState di useEffect.
  const queryArea = searchParams.get('area');
  const queryDir = searchParams.get('direction');
  const queryPax = parseInt(searchParams.get('pax') || '', 10);
  const validQueryArea =
    queryArea && AIRPORT_TRANSFER_RATES.some((r) => r.area === queryArea) ? queryArea : '';
  const validQueryPax =
    !isNaN(queryPax) && queryPax >= 1 && queryPax <= TRANSFER_MAX_PAX ? queryPax : null;

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    adults: validQueryPax ?? 1,
    children: 0,
    notes: '',
  });
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<number[]>([2, 3, 4, 6]);
  const [dpPercentage, setDpPercentage] = useState(30);
  const [minInstallmentAmount, setMinInstallmentAmount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ invoiceNo: string; paymentUrl?: string | null } | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'midtrans' | 'manual'>('manual');
  const [waNumber, setWaNumber] = useState<string>(WA_NUMBER); // nomor WA bisnis dari pengaturan admin

  // --- State layanan khusus HAYBALI TRANS ---
  const [pickupTime, setPickupTime] = useState('');
  const [pickupZone, setPickupZone] = useState('');
  const [destinationArea, setDestinationArea] = useState(''); // area tujuan sewa mobil (id konstanta)
  const [rentalDuration, setRentalDuration] = useState<'6' | '12'>('12'); // durasi sewa mobil
  const [direction, setDirection] = useState<Direction>(queryDir === 'DROP' ? 'DROP' : 'PICKUP');
  const [transferArea, setTransferArea] = useState(validQueryArea);
  const [flightNo, setFlightNo] = useState('');

  const isCarRental = tour?.category === 'CAR_RENTAL';
  const isTransfer = tour?.category === 'AIRPORT_TRANSFER';
  const isSpecialService = isCarRental || isTransfer;

  // Data armada untuk produk sewa mobil (harga 6/12 jam sesuai konstanta resmi)
  const fleetCar = isCarRental && tour ? FLEET.find((f) => f.slug === tour.slug) : undefined;

  // Grup area terpencil per wilayah (untuk select area tujuan sewa mobil)
  const remoteRegions = REMOTE_AREA_FEES.reduce<Record<string, typeof REMOTE_AREA_FEES>>((acc, a) => {
    (acc[a.region] ||= []).push(a);
    return acc;
  }, {});

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
          if (data.data.paymentGateway === 'midtrans') {
            setPaymentGateway('midtrans');
          }
          if (typeof data.data.whatsappNumber === 'string' && data.data.whatsappNumber) {
            setWaNumber(data.data.whatsappNumber);
          }
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

  // Scroll ke atas setiap ganti langkah agar bagian penting tidak terlewat
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
    if (isCarRental) {
      if (!pickupTime) errs.pickupTime = 'Pilih jam penjemputan';
      if (!pickupZone) errs.pickupZone = 'Pilih zona penjemputan';
      if (!destinationArea) errs.destinationArea = 'Pilih area tujuan';
    }
    if (isTransfer && !transferArea) errs.transferArea = 'Pilih area / tujuan';
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
      if (paymentType === 'INSTALLMENT' && !installmentAvailable) {
        setPaymentType('FULL');
        setAgreedToTerms(false);
      }
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
          // Layanan khusus HAYBALI TRANS
          pickupTime: isCarRental ? pickupTime : undefined,
          pickupArea: isCarRental ? pickupZone : undefined,
          dropoffArea: isCarRental ? destinationArea : undefined,
          duration: isCarRental ? rentalDuration : undefined,
          transferArea: isTransfer ? transferArea : undefined,
          direction: isTransfer ? direction : undefined,
          flightNo: isTransfer ? flightNo : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setStep(5);
        // Pembayaran manual: langsung alihkan ke WhatsApp dengan info booking
        // lengkap + nomor invoice (layar "Booking Berhasil!" tidak ditampilkan)
        if (paymentGateway === 'manual' && tour) {
          const waUrl = buildManualWaLink(data.data.invoiceNo);
          if (waUrl) window.location.assign(waUrl);
        }
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
        <div className="bg-ink-850 rounded-xl shadow-sm p-6 space-y-6">
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
        <h2 className="text-2xl font-bold text-mist mb-2">Paket tidak ditemukan</h2>
        <Button href="/tours" variant="primary">Lihat Paket Lain</Button>
      </div>
    );
  }

  const carBasePrice = isCarRental
    ? getCarRentalBasePrice(slug, rentalDuration === '6' ? 6 : 12)
    : 0;
  const carQuote = isCarRental
    ? calcCarRentalTotal(carBasePrice, destinationArea, pickupTime)
    : null;
  const transferPrice = isTransfer ? getTransferPrice(transferArea, formData.adults) ?? 0 : null;
  const total = isSpecialService
    ? isCarRental
      ? (carQuote?.total ?? 0)
      : transferPrice ?? 0
    : tour.priceAdult * formData.adults + tour.priceChild * formData.children;
  const grandTotal = isSpecialService ? total : total - total * (tour.discount / 100);
  const installmentThresholdMet = minInstallmentAmount <= 0 || grandTotal >= minInstallmentAmount;
  const installmentAvailable = installmentEnabled && installmentThresholdMet;

  // Link WhatsApp prefill untuk pembayaran manual — berisi info booking + nomor invoice
  const buildManualWaLink = (invoiceNo: string): string => {
    if (!tour) return '';
    // Origin browser customer — link invoice akan mengarah ke situs yang sama
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const extraLines: string[] = [];
    if (isCarRental) {
      extraLines.push(`• Durasi: ${rentalDuration} Jam`);
      if (pickupTime) extraLines.push(`• Jam Penjemputan: ${pickupTime}`);
      if (pickupZone) extraLines.push(`• Zona Penjemputan: ${pickupZone}`);
      const areaLabel = destinationArea
        ? (REMOTE_AREA_FEES.find((a) => a.id === destinationArea)?.label ||
            STANDARD_AREAS.find((a) => a.id === destinationArea)?.label ||
            '')
        : '';
      if (areaLabel) extraLines.push(`• Area Tujuan: ${areaLabel}`);
    }
    if (isTransfer) {
      extraLines.push(
        `• Rute: ${direction === 'DROP' ? 'Antar ke Bandara' : 'Jemput di Bandara'} — ${transferArea || '-'}`
      );
      extraLines.push(`• Penumpang: ${formData.adults} orang`);
      if (flightNo) extraLines.push(`• No. Penerbangan: ${flightNo}`);
    }
    if (!isSpecialService) {
      extraLines.push(
        `• Peserta: ${formData.adults} dewasa${formData.children > 0 ? `, ${formData.children} anak` : ''}`
      );
    }
    const paymentLabel =
      paymentType === 'INSTALLMENT'
        ? `Cicilan ${installmentCount}x (DP ${dpPercentage}%)`
        : 'Pembayaran Lunas (Transfer Bank)';
    return waBookingLink(
      {
        invoiceNo,
        invoiceUrl: origin ? `${origin}/invoice/${invoiceNo}` : undefined,
        customerName: formData.customerName,
        serviceLabel: tour.name,
        dateLabel: formatDate(selectedDate),
        totalLabel: formatCurrency(grandTotal),
        paymentLabel,
        extraLines,
      },
      waNumber
    );
  };
  const manualWaUrl =
    step === 5 && bookingResult && paymentGateway === 'manual'
      ? buildManualWaLink(bookingResult.invoiceNo)
      : '';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Booking Steps Progress */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Pilih Tanggal', 'Isi Data', 'Metode Bayar', 'Konfirmasi'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-gold-400 text-ink-950' : 'bg-ink-700 text-mist-dim'
                  }`}
                >
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${step >= i + 1 ? 'text-ivory font-medium' : 'text-mist-dim'}`}>
                  {label}
                </span>
                {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-500' : 'bg-ink-700'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Select Date */}
      {step === 1 && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-1">
            {isCarRental
              ? 'Pilih Tanggal & Detail Perjalanan'
              : isTransfer
                ? 'Pilih Tanggal & Tujuan'
                : 'Pilih Tanggal Keberangkatan'}
          </h2>
          <p className="text-mist-dim text-sm mb-6">{tour.name} &bull; {tour.duration}</p>

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
                <div className="flex items-center gap-2 text-sm text-mist-dim p-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold-400 border-t-transparent" />
                  Mengecek ketersediaan...
                </div>
              ) : (
                <div
                  className={`rounded-xl p-4 border ${
                    slotInfo?.isBlackout
                      ? 'bg-red-500/10 border-red-500/30'
                      : slotInfo && slotInfo.bookedCount >= slotInfo.quota
                      ? 'bg-red-500/10 border-red-500/30'
                      : slotInfo && slotInfo.quota - slotInfo.bookedCount <= 3
                      ? 'bg-gold-400/10 border-gold-500/30'
                      : 'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  {slotInfo?.isBlackout ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🚫</span>
                        <span className="font-semibold text-red-300">Tanggal Tidak Tersedia</span>
                      </div>
                      <p className="text-sm text-red-300">
                        Tanggal ini tidak menerima booking. Silakan pilih tanggal lain.
                      </p>
                    </>
                  ) : slotInfo && slotInfo.bookedCount >= slotInfo.quota ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">😞</span>
                        <span className="font-semibold text-red-300">Slot Penuh</span>
                      </div>
                      <p className="text-sm text-red-300">
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
                            <span className="font-semibold text-ivory">
                              {slotInfo.quota - slotInfo.bookedCount <= 3
                                ? 'Hampir Penuh'
                                : 'Tersedia'}
                            </span>
                            <p className="text-sm text-mist">
                              {slotInfo.quota - slotInfo.bookedCount} dari {slotInfo.quota} kursi tersisa
                            </p>
                          </div>
                        </div>
                        {slotInfo.priceOverride && (
                          <span className="text-sm font-semibold text-gold-200 bg-gold-400/15 px-3 py-1 rounded-full">
                            {formatCurrency(slotInfo.priceOverride)}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-ink-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            slotInfo.quota - slotInfo.bookedCount <= 3
                              ? 'bg-gold-400'
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
                        <span className="font-semibold text-green-300">Kuota Default</span>
                      </div>
                      <p className="text-sm text-green-300">
                        {tour.maxSlot} kursi tersedia — belum ada pemesanan untuk tanggal ini.
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

          {/* ==== Form khusus: Sewa Mobil ==== */}
          {isCarRental && (
            <div className="mt-6 max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Durasi Sewa</label>
                {fleetCar?.price6h != null ? (
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRentalDuration('6')}
                      className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                        rentalDuration === '6'
                          ? 'border-gold-400 bg-gold-400/10 text-gold-200'
                          : 'border-ink-700 text-mist hover:border-ink-600'
                      }`}
                    >
                      6 Jam — {formatCurrency(fleetCar.price6h)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentalDuration('12')}
                      className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                        rentalDuration === '12'
                          ? 'border-gold-400 bg-gold-400/10 text-gold-200'
                          : 'border-ink-700 text-mist hover:border-ink-600'
                      }`}
                    >
                      12 Jam — {formatCurrency(fleetCar.price12h)}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-mist bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5">
                    12 Jam — {formatCurrency(fleetCar?.price12h ?? tour.priceAdult)}
                  </p>
                )}
                <p className="text-xs text-mist-dim mt-1">
                  Lembur dikenakan {fleetCar?.overtimePct ?? 10}% dari harga/jam.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">Jam Penjemputan</label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                >
                  <option value="">— Pilih jam penjemputan —</option>
                  {getPickupTimeOptions().map((t) => (
                    <option key={t} value={t}>
                      {t}
                      {calcLatePickupFee(t) > 0 ? ` (+${formatCurrency(DRIVER_POLICY.latePickupFee)})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-mist-dim mt-1">
                  Tarif normal berlaku untuk penjemputan {DRIVER_POLICY.normalPickupStart}–{DRIVER_POLICY.normalPickupEnd}.
                </p>
                {errors.pickupTime && <p className="text-red-500 text-sm mt-1">{errors.pickupTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">Zona Penjemputan</label>
                <select
                  value={pickupZone}
                  onChange={(e) => setPickupZone(e.target.value)}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                >
                  <option value="">— Pilih zona —</option>
                  {PICKUP_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                <p className="text-xs text-mist-dim mt-1">
                  Area lain silakan hubungi kami untuk informasi harga & ketersediaan.
                </p>
                {errors.pickupZone && <p className="text-red-500 text-sm mt-1">{errors.pickupZone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">Area Tujuan</label>
                <select
                  value={destinationArea}
                  onChange={(e) => setDestinationArea(e.target.value)}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                >
                  <option value="">— Pilih area tujuan —</option>
                  <optgroup label="Area Standar (Tanpa Biaya Tambahan)">
                    {STANDARD_AREAS.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </optgroup>
                  {Object.entries(remoteRegions).map(([region, areas]) => (
                    <optgroup key={region} label={`${region} (Biaya Tambahan)`}>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} — +{formatCurrency(a.fee)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.destinationArea && <p className="text-red-500 text-sm mt-1">{errors.destinationArea}</p>}
              </div>

              {/* Rincian harga sewa mobil */}
              {pickupTime && destinationArea && (
                <div className="bg-gold-400/10 border border-gold-500/20 rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-mist">Harga Armada ({rentalDuration} Jam)</span>
                    <span className="font-medium">{formatCurrency(carQuote?.base ?? 0)}</span>
                  </div>
                  {(carQuote?.remoteFee ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-mist">Biaya Area Terpencil</span>
                      <span className="font-medium text-gold-300">+{formatCurrency(carQuote?.remoteFee ?? 0)}</span>
                    </div>
                  )}
                  {(carQuote?.latePickupFee ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-mist">Biaya Jam di Luar Tarif Normal</span>
                      <span className="font-medium text-gold-300">+{formatCurrency(carQuote?.latePickupFee ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-gold-500/20">
                    <span>Total</span>
                    <span className="text-gold-200">{formatCurrency(carQuote?.total ?? 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==== Form khusus: Antar-Jemput Bandara ==== */}
          {isTransfer && (
            <div className="mt-6 max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Arah Perjalanan</label>
                <div className="grid grid-cols-2 gap-2">
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
                  value={transferArea}
                  onChange={(e) => setTransferArea(e.target.value)}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                >
                  <option value="">— Pilih area —</option>
                  {AIRPORT_TRANSFER_RATES.map((r) => (
                    <option key={r.area} value={r.area}>
                      {r.area} — {formatCurrency(r.priceSmall)}
                    </option>
                  ))}
                </select>
                {errors.transferArea && <p className="text-red-500 text-sm mt-1">{errors.transferArea}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">
                  Jumlah Penumpang ({formData.adults <= 5 ? '1-5 orang' : '6-10 orang'})
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 text-lg font-semibold"
                    aria-label="Kurangi penumpang"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={TRANSFER_MAX_PAX}
                    value={formData.adults}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      if (!isNaN(num)) updateField('adults', Math.min(TRANSFER_MAX_PAX, Math.max(1, num)));
                    }}
                    className="w-full h-11 px-3 border-y border-ink-600 rounded-none text-center focus:ring-2 focus:ring-gold-400 focus:border-gold-400 focus:z-10 bg-ink-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.min(TRANSFER_MAX_PAX, formData.adults + 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-r-xl bg-ink-900 text-mist hover:bg-ink-800 text-lg font-semibold"
                    aria-label="Tambah penumpang"
                  >
                    +
                  </button>
                </div>
                {AIRPORT_TRANSFER_RATES.find((r) => r.area === transferArea)?.priceBig === null && formData.adults >= 6 && (
                  <p className="text-gold-300 text-xs mt-1.5">
                    Area ini hanya melayani 1-5 penumpang. Untuk rombongan, silakan hubungi kami via WhatsApp.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">Nomor Penerbangan (Opsional)</label>
                <input
                  type="text"
                  value={flightNo}
                  onChange={(e) => setFlightNo(e.target.value)}
                  placeholder="Contoh: GA 402"
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                />
              </div>

              {transferArea && transferPrice !== null && transferPrice > 0 && (
                <div className="bg-gold-400/10 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-gold-200">
                    Tarif ({formData.adults <= 5 ? '1-5 orang' : '6-10 orang'}) — {direction === 'PICKUP' ? 'Jemput di Bandara' : 'Antar ke Bandara'}
                  </span>
                  <span className="text-xl font-bold text-gold-200">{formatCurrency(transferPrice)}</span>
                </div>
              )}
            </div>
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
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-1">Isi Data Diri & Peserta</h2>
          <p className="text-mist-dim text-sm mb-6">Lengkapi data berikut untuk melanjutkan booking</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mist mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
              />
              {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                />
                {errors.customerEmail && <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                />
                {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
              </div>
            </div>

            {!isSpecialService && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Jumlah Dewasa</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
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
                    className="w-full h-11 px-3 border-y border-ink-600 rounded-none text-center focus:ring-2 focus:ring-gold-400 focus:border-gold-400 focus:z-10 bg-ink-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('adults', formData.adults + 1)}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-r-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
                    aria-label="Tambah dewasa"
                  >
                    +
                  </button>
                </div>
                {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-mist mb-1">Jumlah Anak</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('children', Math.max(0, formData.children - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
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
                    className="w-full h-11 px-3 border-y border-ink-600 rounded-none text-center focus:ring-2 focus:ring-gold-400 focus:border-gold-400 focus:z-10 bg-ink-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('children', formData.children + 1)}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-r-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
                    aria-label="Tambah anak"
                  >
                    +
                  </button>
                </div>
                {errors.children && <p className="text-red-500 text-sm mt-1">{errors.children}</p>}
              </div>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-mist mb-1">Catatan Khusus (Opsional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Ada permintaan khusus? Tulis di sini..."
                rows={3}
                className="w-full px-4 py-2.5 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900 resize-y"
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
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-1">Pilih Metode Pembayaran</h2>
          <p className="text-mist-dim text-sm mb-6">Pilih cara pembayaran yang sesuai untuk Anda</p>

          <div className="space-y-4 mb-6">
            {/* Full Payment */}
            <div
              onClick={() => { setPaymentType('FULL'); setAgreedToTerms(false); }}
              className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
                paymentType === 'FULL'
                  ? 'border-gold-400 ring-2 ring-gold-400/30 bg-gold-400/10'
                  : 'border-ink-700 hover:border-ink-600 bg-ink-850'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentType === 'FULL' ? 'border-gold-400' : 'border-ink-600'
                }`}>
                  {paymentType === 'FULL' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ivory">Pembayaran Lunas</h3>
                  <p className="text-sm text-mist-dim mt-0.5">Bayar penuh sekarang sebesar <strong className="text-mist">{formatCurrency(grandTotal)}</strong></p>
                  {paymentGateway === 'midtrans' ? (
                    <p className="text-xs text-green-300 mt-1">💳 Pembayaran online instan via Midtrans — QRIS, Virtual Account, e-wallet, atau kartu. Terkonfirmasi otomatis.</p>
                  ) : (
                    <p className="text-xs text-mist-dim mt-1">🏦 Transfer bank ke rekening pada invoice, lalu konfirmasi pembayaran ke admin via WhatsApp. Status diaktifkan manual oleh admin.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Installment Payment */}
            <div
              onClick={() => {
                if (!installmentAvailable) return;
                setPaymentType('INSTALLMENT');
                setAgreedToTerms(false);
              }}
              className={`rounded-xl border-2 p-5 transition-all ${
                paymentType === 'INSTALLMENT'
                  ? 'border-gold-400 ring-2 ring-gold-400/30 bg-gold-400/10'
                  : installmentAvailable
                    ? 'cursor-pointer border-ink-700 hover:border-ink-600 bg-ink-850'
                    : 'cursor-not-allowed border-ink-700 bg-ink-900 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentType === 'INSTALLMENT' ? 'border-gold-400' : 'border-ink-600'
                }`}>
                  {paymentType === 'INSTALLMENT' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ivory">Pembayaran Angsuran (Cicilan)</h3>
                  <p className="text-sm text-mist-dim mt-0.5">Bayar dengan DP {dpPercentage}% dan sisanya dicicil sesuai pilihan Anda</p>
                  {paymentGateway === 'midtrans' ? (
                    <p className="text-xs text-green-300 mt-1">💳 DP &amp; angsuran dibayar online via Midtrans — terkonfirmasi otomatis, tanpa transfer manual.</p>
                  ) : (
                    <p className="text-xs text-mist-dim mt-1">🏦 DP &amp; angsuran dibayar via transfer bank — unggah bukti transfer di halaman jadwal angsuran, konfirmasi oleh admin.</p>
                  )}
                  {!installmentEnabled && (
                    <p className="text-xs text-mist-dim mt-1">Belum tersedia saat ini.</p>
                  )}
                  {installmentEnabled && !installmentThresholdMet && (
                    <p className="text-xs text-gold-300 mt-1">Minimal total transaksi {formatCurrency(minInstallmentAmount)} untuk pembayaran angsuran.</p>
                  )}
                </div>
              </div>

                {paymentType === 'INSTALLMENT' && (
                  <div className="mt-4 ml-9 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-mist mb-2">Jumlah Angsuran</label>
                      <div className="flex flex-wrap gap-2">
                        {installmentOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setInstallmentCount(opt); }}
                            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
                              installmentCount === opt
                                ? 'bg-gold-400 text-ink-950'
                                : 'bg-ink-850 border border-ink-600 text-mist hover:bg-ink-800'
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
                        <div className="bg-ink-850 border border-ink-700 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-mist">Simulasi Angsuran</h4>
                          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                            <span className="text-mist-dim">Total Harga</span>
                            <span className="text-right font-medium">{formatCurrency(grandTotal)}</span>
                            <span className="text-mist-dim">DP ({dpPercentage}%)</span>
                            <span className="text-right font-medium text-gold-300">{formatCurrency(dp)}</span>
                            <span className="text-mist-dim">Sisa</span>
                            <span className="text-right font-medium">{formatCurrency(remaining)}</span>
                            <span className="text-mist-dim pt-2 border-t">Angsuran / Bulan</span>
                            <span className="text-right font-bold text-gold-300 pt-2 border-t">{installmentCount}x {formatCurrency(perInstallment)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
          </div>

          {paymentType === 'INSTALLMENT' && (
            <div className="mt-4 p-4 bg-gold-400/10 border border-gold-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-gold-200 mb-2">Syarat & Ketentuan Angsuran</h4>
              <ol className="text-xs text-gold-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Pembayaran angsuran wajib dilakukan sesuai jadwal jatuh tempo yang telah disepakati.</li>
                <li>Setiap angsuran harus dibayar paling lambat pada tanggal jatuh tempo. Keterlambatan lebih dari 7 hari setelah jatuh tempo dapat mengakibatkan pembatalan pesanan.</li>
                <li>Uang muka (DP) dan angsuran yang telah dibayarkan <strong>tidak dapat dikembalikan</strong>.</li>
                <li>Seluruh angsuran harus <strong>lunas H-7</strong> sebelum tanggal keberangkatan. Jika belum lunas, pihak tour berhak menunda atau membatalkan keberangkatan.</li>
                <li>
                  {paymentGateway === 'midtrans'
                    ? <>DP dan angsuran dibayar <strong>online</strong> (QRIS / Virtual Account / e-wallet / kartu) melalui halaman <strong>Jadwal &amp; Bayar Angsuran</strong> pada invoice Anda. Status pembayaran <strong>terkonfirmasi otomatis</strong>.</>
                    : <>Bukti transfer diunggah melalui halaman <strong>Jadwal &amp; Bayar Angsuran</strong> pada invoice Anda (atau dikirim via WhatsApp/email). Admin akan memverifikasi dan mengkonfirmasi pembayaran.</>}
                </li>
              </ol>
              <label className="flex items-start gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-gold-300 border-ink-600 rounded focus:ring-gold-400"
                />
                <span className="text-sm text-gold-200">
                  Saya telah membaca dan menyetujui syarat & ketentuan pembayaran angsuran di atas
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button onClick={() => { setStep(2); setAgreedToTerms(false); }} variant="outline">← Kembali</Button>
            <Button
              onClick={handleNext}
              variant="primary"
              disabled={paymentType === 'INSTALLMENT' && !agreedToTerms}
            >
              Lanjutkan →
            </Button>
          </div>
          {paymentType === 'INSTALLMENT' && !agreedToTerms && (
            <p className="text-xs text-gold-300 text-right mt-2">Centang persetujuan Syarat & Ketentuan angsuran di atas untuk melanjutkan.</p>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-4">Konfirmasi Pemesanan</h2>

          <div className="border border-ink-700 rounded-lg p-4 space-y-3 bg-ink-900 mb-6">
            <div>
              <span className="text-sm text-mist-dim">Paket Tour</span>
              <p className="font-semibold text-ivory">{tour.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-mist-dim">Tanggal</span>
                <p className="font-medium">{formatDate(selectedDate)}</p>
              </div>
              <div>
                <span className="text-sm text-mist-dim">{isCarRental ? 'Unit' : isTransfer ? 'Penumpang' : 'Peserta'}</span>
                <p className="font-medium">
                  {isCarRental
                    ? '1 Mobil (12 Jam)'
                    : isTransfer
                      ? `${formData.adults} Orang (${formData.adults <= 5 ? '1-5' : '6-10'})`
                      : `${formData.adults} Dewasa${formData.children > 0 ? `, ${formData.children} Anak` : ''}`}
                </p>
              </div>
            </div>
            {isCarRental && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-mist-dim">Jam Penjemputan</span>
                  <p className="font-medium">{pickupTime}</p>
                </div>
                <div>
                  <span className="text-sm text-mist-dim">Zona Penjemputan</span>
                  <p className="font-medium">{pickupZone}</p>
                </div>
              </div>
            )}
            {isCarRental && destinationArea && (
              <div>
                <span className="text-sm text-mist-dim">Area Tujuan</span>
                <p className="font-medium">
                  {REMOTE_AREA_FEES.find((a) => a.id === destinationArea)?.label ||
                    STANDARD_AREAS.find((a) => a.id === destinationArea)?.label}
                </p>
              </div>
            )}
            {isTransfer && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-mist-dim">Arah</span>
                  <p className="font-medium">{direction === 'PICKUP' ? 'Jemput di Bandara' : 'Antar ke Bandara'}</p>
                </div>
                <div>
                  <span className="text-sm text-mist-dim">Area</span>
                  <p className="font-medium">{transferArea}</p>
                </div>
              </div>
            )}
            {isTransfer && flightNo && (
              <div>
                <span className="text-sm text-mist-dim">Nomor Penerbangan</span>
                <p className="font-medium">{flightNo}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-mist-dim">Nama Pemesan</span>
              <p className="font-medium">{formData.customerName}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <span className="text-sm text-mist-dim">Email</span>
                <p className="font-medium text-sm break-all">{formData.customerEmail}</p>
              </div>
              <div>
                <span className="text-sm text-mist-dim">No. HP</span>
                <p className="font-medium">{formData.customerPhone}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-mist-dim">Metode Pembayaran</span>
              <p className="font-medium">
                {paymentType === 'FULL'
                  ? paymentGateway === 'midtrans'
                    ? 'Pembayaran Lunas (Online — QRIS / VA / E-Wallet / Kartu)'
                    : 'Pembayaran Lunas (Transfer Bank)'
                  : `Angsuran ${installmentCount}x${paymentGateway === 'midtrans' ? ' (Online — DP + cicilan otomatis)' : ''}`}
              </p>
            </div>
            {paymentType === 'INSTALLMENT' && (
              <div className="bg-gold-400/10 rounded-lg p-3 border border-gold-500/20">
                <p className="text-sm font-medium text-gold-200">Detail Angsuran:</p>
                <p className="text-xs text-gold-300 mt-1">
                  DP {dpPercentage}%: {formatCurrency(Math.round(grandTotal * (dpPercentage / 100)))} &bull; Sisa {installmentCount}x @ {formatCurrency(Math.round((grandTotal - Math.round(grandTotal * (dpPercentage / 100))) / installmentCount))}/bulan
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            {isCarRental ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-mist-dim">Harga Armada ({rentalDuration} Jam)</span>
                  <span>{formatCurrency(carQuote?.base ?? 0)}</span>
                </div>
                {(carQuote?.remoteFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist-dim">Biaya Area Terpencil</span>
                    <span className="text-gold-300">+{formatCurrency(carQuote?.remoteFee ?? 0)}</span>
                  </div>
                )}
                {(carQuote?.latePickupFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist-dim">Biaya Jam Penjemputan</span>
                    <span className="text-gold-300">+{formatCurrency(carQuote?.latePickupFee ?? 0)}</span>
                  </div>
                )}
              </>
            ) : isTransfer ? (
              <div className="flex justify-between text-sm">
                <span className="text-mist-dim">
                  Tarif {formData.adults <= 5 ? '1-5' : '6-10'} Orang — {transferArea}
                </span>
                <span>{formatCurrency(transferPrice ?? 0)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-mist-dim">Harga Dewasa ({formData.adults} x {formatCurrency(tour.priceAdult)})</span>
                  <span>{formatCurrency(tour.priceAdult * formData.adults)}</span>
                </div>
                {formData.children > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist-dim">Harga Anak ({formData.children} x {formatCurrency(tour.priceChild)})</span>
                    <span>{formatCurrency(tour.priceChild * formData.children)}</span>
                  </div>
                )}
                {tour.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-300">
                    <span>Diskon ({tour.discount}%)</span>
                    <span>-{formatCurrency(total * (tour.discount / 100))}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-gold-300">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
            <Button onClick={() => setStep(3)} variant="outline">← Kembali</Button>
            <Button onClick={handleSubmit} variant="accent" size="lg" isLoading={submitting}>
              Booking Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Success / Invoice */}
      {step === 5 && bookingResult && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-ivory mb-2">Booking Berhasil!</h2>
          {bookingResult.paymentUrl ? (
            <p className="text-mist-dim mb-6">
              {paymentType === 'INSTALLMENT' ? (
                <>
                  Langkah terakhir: bayar <strong>DP (uang muka)</strong> melalui halaman pembayaran aman
                  (QRIS, Virtual Account, e-wallet, atau kartu). Angsuran berikutnya dibayar melalui halaman{' '}
                  <strong>Jadwal &amp; Bayar Angsuran</strong> — setiap pembayaran terkonfirmasi otomatis.
                </>
              ) : (
                <>
                  Invoice Anda telah diterbitkan. Selesaikan pembayaran melalui halaman pembayaran aman
                  (QRIS, Virtual Account, e-wallet, atau kartu kredit/debit) — pesanan Anda akan
                  terkonfirmasi otomatis setelah pembayaran berhasil.
                </>
              )}
            </p>
          ) : paymentGateway === 'midtrans' ? (
            <p className="text-mist-dim mb-6">
              Invoice Anda telah diterbitkan. Buka halaman invoice untuk menyelesaikan pembayaran secara online.
            </p>
          ) : (
            <p className="text-mist-dim mb-6">
              {paymentType === 'INSTALLMENT'
                ? <>Invoice Anda telah diterbitkan. Chat WhatsApp berisi detail booking Anda akan terbuka otomatis — tinggal tekan kirim (atau klik tombol hijau bila chat tidak terbuka), lalu transfer DP sesuai rekening pada invoice.</>
                : <>Invoice Anda telah diterbitkan. Chat WhatsApp berisi detail booking Anda akan terbuka otomatis — tinggal tekan kirim (atau klik tombol hijau bila chat tidak terbuka), lalu transfer sesuai rekening pada invoice.</>}
            </p>
          )}

          <div className="bg-ink-900 rounded-lg p-6 mb-6">
            <p className="text-sm text-mist-dim mb-1">Nomor Invoice</p>
            <p className="text-2xl font-bold text-gold-300">{bookingResult.invoiceNo}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {paymentGateway === 'manual' && manualWaUrl && (
              <Button
                href={manualWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="success"
                size="lg"
              >
                💬 Kirim Booking via WhatsApp
              </Button>
            )}
            {bookingResult.paymentUrl && (
              <Button href={bookingResult.paymentUrl} variant="accent" size="lg">
                {paymentType === 'INSTALLMENT' ? '💳 Bayar DP Online' : '💳 Bayar Online Sekarang'}
              </Button>
            )}
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
