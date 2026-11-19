'use client';

import { useState, useEffect, Suspense, type SyntheticEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { formatUsdFromIdr } from '@/lib/currency';
import {
  STANDARD_AREAS,
  REMOTE_AREA_FEES,
  FLEET,
  AIRPORT_TRANSFER_RATES,
  TRANSFER_MAX_PAX,
  DRIVER_POLICY,
  WA_NUMBER,
  getTransferPrice,
  getCarRentalBasePrice,
  calcCarRentalTotal,
  calcLatePickupFee,
  isValidPickupTime,
  formatTime12h,
  formatPickupWindow12h,
  waBookingLink,
} from '@/lib/haybali';
import Button from '@/components/ui/Button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

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

// Format digit ketikan jam penjemputan: "730" → "7:30", "1230" → "12:30", "9" → "9".
// Hanya digit valid yang dipertahankan; jam 01–12, menit diawali 0–5.
function formatPickupDigits(digits: string): string {
  if (!digits) return '';
  const first = digits[0];
  const minutePart = (from: number) => digits.slice(from, from + 2).replace(/^[6-9]/, '');
  if (first === '0') {
    if (digits.length === 1) return '0';
    const second = digits[1];
    if (second < '1' || second > '9') return '0'; // "00" ditolak
    const mm = minutePart(2);
    return `0${second}${mm ? `:${mm}` : ''}`;
  }
  if (first === '1' && digits.length > 1 && digits[1] <= '2') {
    const mm = minutePart(2);
    return `1${digits[1]}${mm ? `:${mm}` : ''}`;
  }
  // Jam satu digit (1–9): menit mengikuti setelah titik dua
  const mm = minutePart(1);
  return `${first}${mm ? `:${mm}` : ''}`;
}

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
  const { t, tOr, list, locale, usdRate, formatPrice } = useI18n();
  useTranslatedMeta(t('meta.booking'));

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
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [dpPercentage, setDpPercentage] = useState(50);
  const [minInstallmentAmount, setMinInstallmentAmount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ invoiceNo: string } | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [waNumber, setWaNumber] = useState<string>(WA_NUMBER); // nomor WA bisnis dari pengaturan admin

  // --- State layanan khusus HAYBALI TRANS ---
  const [pickupTime, setPickupTime] = useState(''); // nilai kanonik "HH:MM" (24 jam) untuk harga & API
  const [pickupTimeText, setPickupTimeText] = useState(''); // ketikan "H:MM"/"HH:MM" 12 jam (dibatasi)
  const [pickupPeriod, setPickupPeriod] = useState<'AM' | 'PM'>('AM'); // dropdown AM/PM
  const [pickupSegment, setPickupSegment] = useState<'hour' | 'minute'>('hour'); // bagian yang disorot kursor
  const [pickupZone, setPickupZone] = useState('');
  const [destinationArea, setDestinationArea] = useState(''); // area tujuan (diketik manual, biaya info saja)
  const [rentalDuration, setRentalDuration] = useState<'6' | '12'>('12'); // durasi sewa mobil
  const [direction, setDirection] = useState<Direction>(queryDir === 'DROP' ? 'DROP' : 'PICKUP');
  const [transferArea, setTransferArea] = useState(validQueryArea);
  const [flightNo, setFlightNo] = useState('');

  const isCarRental = tour?.category === 'CAR_RENTAL';
  const isTransfer = tour?.category === 'AIRPORT_TRANSFER';
  const isSpecialService = isCarRental || isTransfer;

  // Data armada untuk produk sewa mobil (harga 6/12 jam sesuai konstanta resmi)
  const fleetCar = isCarRental && tour ? FLEET.find((f) => f.slug === tour.slug) : undefined;

  // Grup area terpencil per wilayah (hanya info biaya, tidak dihitung otomatis)
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
          if (typeof data.data.whatsappNumber === 'string' && data.data.whatsappNumber) {
            setWaNumber(data.data.whatsappNumber);
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

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Gabungkan ketikan "H:MM"/"HH:MM" + periode menjadi "HH:MM" 24 jam; kosong bila belum lengkap.
  const applyPickupTime = (display: string, period: 'AM' | 'PM') => {
    clearError('pickupTime');
    const m = /^(0?[1-9]|1[0-2]):([0-5]\d)$/.exec(display);
    if (!m) {
      setPickupTime('');
      return;
    }
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const h24 = hour === 12 ? (period === 'AM' ? 0 : 12) : (hour % 12) + (period === 'PM' ? 12 : 0);
    setPickupTime(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  // Ketikan dibatasi: hanya digit; titik dua disisipkan otomatis ("730" → "7:30").
  const handlePickupTimeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const next = formatPickupDigits(digits);
    setPickupTimeText(next);
    applyPickupTime(next, pickupPeriod);
    // Saat mengetik, kursor berada di akhir: ikuti bagian yang sedang diisi.
    const colonIdx = next.indexOf(':');
    setPickupSegment(colonIdx === -1 || next.length <= colonIdx ? 'hour' : 'minute');
  };

  // Ikuti posisi kursor: sebelum titik dua = jam, sesudahnya = menit.
  const handlePickupCaret = (e: SyntheticEvent<HTMLInputElement>) => {
    const pos = (e.target as HTMLInputElement).selectionStart ?? 0;
    const colonIdx = pickupTimeText.indexOf(':');
    setPickupSegment(colonIdx === -1 || pos <= colonIdx ? 'hour' : 'minute');
  };

  // Rapi-rapi saat fokus pindah: "7" → "07:00", "7:3" → "07:03"; kosongkan bila tak valid.
  const normalizePickupTimeOnBlur = () => {
    const m = /^(0?[1-9]|1[0-2])(?::([0-5]?\d))?$/.exec(pickupTimeText);
    let next = '';
    if (m) {
      const hour = String(parseInt(m[1], 10)).padStart(2, '0');
      const minute = String(m[2] ? parseInt(m[2], 10) : 0).padStart(2, '0');
      next = `${hour}:${minute}`;
    }
    if (next !== pickupTimeText) {
      setPickupTimeText(next);
      applyPickupTime(next, pickupPeriod);
    }
  };

  // Tombol ▲▼ mengubah bagian sesuai posisi kursor: jam naik/turun bila kursor
  // di jam, menit naik/turun bila kursor di menit. AM/PM ikut berganti saat
  // jam melewati 11↔12. Saat masih kosong, dimulai dari 07:00 AM.
  const stepPickupSegment = (delta: 1 | -1) => {
    const m = /^(0?[1-9]|1[0-2])(?::([0-5]?\d))?$/.exec(pickupTimeText);
    if (!m) {
      setPickupTimeText('07:00');
      setPickupPeriod('AM');
      applyPickupTime('07:00', 'AM');
      return;
    }
    let hour = parseInt(m[1], 10);
    let minute = m[2] ? parseInt(m[2], 10) : 0;
    let nextPeriod = pickupPeriod;

    const stepHour = (dir: 1 | -1) => {
      if (hour === 11 && dir === 1) {
        hour = 12;
        nextPeriod = nextPeriod === 'AM' ? 'PM' : 'AM';
      } else if (hour === 12 && dir === -1) {
        hour = 11;
        nextPeriod = nextPeriod === 'AM' ? 'PM' : 'AM';
      } else if (hour === 12 && dir === 1) {
        hour = 1;
      } else if (hour === 1 && dir === -1) {
        hour = 12;
      } else {
        hour += dir;
      }
    };

    if (pickupSegment === 'minute') {
      // Menit melingkar 00–59; saat melingkar, jam ikut naik/turun.
      if (minute === 59 && delta === 1) {
        minute = 0;
        stepHour(1);
      } else if (minute === 0 && delta === -1) {
        minute = 59;
        stepHour(-1);
      } else {
        minute += delta;
      }
    } else {
      stepHour(delta);
    }

    const text = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    setPickupTimeText(text);
    setPickupPeriod(nextPeriod);
    applyPickupTime(text, nextPeriod);
  };

  const handlePickupPeriodChange = (p: 'AM' | 'PM') => {
    setPickupPeriod(p);
    applyPickupTime(pickupTimeText, p);
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
    if (!selectedDate) errs.date = t('booking.errors.dateRequired');
    if (isCarRental && !isValidPickupTime(pickupTime)) errs.pickupTime = t('booking.errors.pickupTimeRequired');
    if (isTransfer && !transferArea) errs.transferArea = t('booking.errors.transferAreaRequired');
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.customerName || formData.customerName.trim().length < 3) errs.customerName = t('booking.errors.nameMin');
    if (!formData.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) errs.customerEmail = t('booking.errors.emailInvalid');
    if (!formData.customerPhone || !/^\+?[\d\s-]{8,15}$/.test(formData.customerPhone)) errs.customerPhone = t('booking.errors.phoneInvalid');
    if (formData.adults < 1) errs.adults = t('booking.errors.adultsMin');
    if (formData.children < 0) errs.children = t('booking.errors.childrenInvalid');
    if (tour && formData.adults + formData.children < tour.minPax) errs.adults = t('booking.errors.minPax', { min: tour.minPax });
    if (isCarRental) {
      if (pickupZone.trim().length < 3) errs.pickupZone = t('booking.errors.pickupZoneRequired');
      if (destinationArea.trim().length < 3) errs.destinationArea = t('booking.errors.destinationAreaRequired');
    }
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
      setErrors({ submit: t('booking.errors.submitIncomplete') });
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
          // Skema pembayaran DP: DP di muka + 1 pelunasan (tunai ke sopir atau transfer bank)
          installmentCount: paymentType === 'INSTALLMENT' ? 1 : undefined,
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
        // Pembayaran transfer manual: langsung alihkan ke WhatsApp dengan info booking
        // lengkap + nomor invoice (layar "Booking Berhasil!" tidak ditampilkan)
        if (tour) {
          const waUrl = buildManualWaLink(data.data.invoiceNo);
          if (waUrl) window.location.assign(waUrl);
        }
      } else {
        if (data.errors && typeof data.errors === 'object') {
          setErrors((prev) => ({ ...prev, ...data.errors }));
        } else {
          setErrors({ submit: data.error || data.message || t('booking.errors.submitGeneric') });
        }
      }
    } catch {
      setErrors({ submit: t('booking.errors.submitFailed') });
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
        <h2 className="text-2xl font-bold text-mist mb-2">{t('booking.notFoundTitle')}</h2>
        <Button href="/sewa-mobil" variant="primary">{t('booking.notFoundCta')}</Button>
      </div>
    );
  }

  const carBasePrice = isCarRental
    ? getCarRentalBasePrice(slug, rentalDuration === '6' ? 6 : 12)
    : 0;
  const carQuote = isCarRental
    ? calcCarRentalTotal(carBasePrice, pickupTime)
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

  // Format tanggal sesuai bahasa aktif (id-ID vs en-US)
  const fmtDate = (value: string) =>
    new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(value));

  // Link WhatsApp prefill untuk pembayaran manual — berisi info booking + nomor invoice
  const buildManualWaLink = (invoiceNo: string): string => {
    if (!tour) return '';
    // Origin browser customer — link invoice akan mengarah ke situs yang sama
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const extraLines: string[] = [];
    if (isCarRental) {
      extraLines.push(t('booking.wa.duration', { n: rentalDuration }));
      if (pickupTime) extraLines.push(t('booking.wa.pickupTime', { time: formatTime12h(pickupTime) }));
      if (pickupZone) extraLines.push(t('booking.wa.pickupZone', { zone: pickupZone }));
      if (destinationArea) extraLines.push(t('booking.wa.destinationArea', { area: destinationArea }));
    }
    if (isTransfer) {
      extraLines.push(
        t('booking.wa.route', {
          dir: direction === 'DROP' ? t('booking.wa.routeDrop') : t('booking.wa.routePickup'),
          area: transferArea || '-',
        })
      );
      extraLines.push(t('booking.wa.pax', { n: formData.adults }));
      if (flightNo) extraLines.push(t('booking.wa.flight', { flight: flightNo }));
    }
    if (!isSpecialService) {
      extraLines.push(
        formData.children > 0
          ? t('booking.wa.participants', { adults: formData.adults, children: formData.children })
          : t('booking.wa.participantsNoChild', { adults: formData.adults })
      );
    }
    const paymentLabel =
      paymentType === 'INSTALLMENT'
        ? t('booking.wa.dpLabel', { pct: dpPercentage })
        : t('booking.wa.fullLabel');
    return waBookingLink(
      {
        invoiceNo,
        invoiceUrl: origin ? `${origin}/invoice/${invoiceNo}` : undefined,
        customerName: formData.customerName,
        serviceLabel: tour.name,
        dateLabel: fmtDate(selectedDate),
        totalLabel:
          locale === 'en'
            ? `${formatCurrency(grandTotal)} (≈ ${formatUsdFromIdr(grandTotal, usdRate)})`
            : formatCurrency(grandTotal),
        paymentLabel,
        extraLines,
      },
      waNumber,
      locale
    );
  };
  const manualWaUrl =
    step === 5 && bookingResult
      ? buildManualWaLink(bookingResult.invoiceNo)
      : '';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      {/* Booking Steps Progress */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {(list('booking.steps') as string[]).map((label, i) => (
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
              ? t('booking.step1Car')
              : isTransfer
                ? t('booking.step1Transfer')
                : t('booking.step1Default')}
          </h2>
          <p className="text-mist-dim text-sm mb-6">
            {tour.name} &bull;{' '}
            {isCarRental
              ? tOr(fleetCar?.price6h != null ? 'booking.durationTag6or12' : 'booking.durationTag12', tour.duration)
              : tour.duration}
          </p>

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
                  {t('booking.checking')}
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
                        <span className="font-semibold text-red-300">{t('booking.blackoutTitle')}</span>
                      </div>
                      <p className="text-sm text-red-300">
                        {t('booking.blackoutDesc')}
                      </p>
                    </>
                  ) : slotInfo && slotInfo.bookedCount >= slotInfo.quota ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">😞</span>
                        <span className="font-semibold text-red-300">{t('booking.fullSlotTitle')}</span>
                      </div>
                      <p className="text-sm text-red-300">
                        {t('booking.fullSlotDesc', { quota: slotInfo.quota })}
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
                                ? t('booking.almostFull')
                                : t('booking.available')}
                            </span>
                            <p className="text-sm text-mist">
                              {t('booking.seatsLeft', {
                                left: slotInfo.quota - slotInfo.bookedCount,
                                quota: slotInfo.quota,
                              })}
                            </p>
                          </div>
                        </div>
                        {slotInfo.priceOverride && (
                          <span className="text-sm font-semibold text-gold-200 bg-gold-400/15 px-3 py-1 rounded-full">
                            {formatPrice(slotInfo.priceOverride)}
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
                        <span className="font-semibold text-green-300">{t('booking.defaultQuota')}</span>
                      </div>
                      <p className="text-sm text-green-300">
                        {t('booking.defaultQuotaDesc', { maxSlot: tour.maxSlot })}
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
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.durationLabel')}</label>
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
                      {t('booking.duration6', { price: formatPrice(fleetCar.price6h) })}
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
                      {t('booking.duration12', { price: formatPrice(fleetCar.price12h) })}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-mist bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5">
                    {t('booking.duration12', { price: formatPrice(fleetCar?.price12h ?? tour.priceAdult) })}
                  </p>
                )}
                <p className="text-xs text-mist-dim mt-1">
                  {t('booking.overtimeNote', { pct: fleetCar?.overtimePct ?? 10 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.pickupTimeLabel')}</label>
                <div className="flex items-center gap-2">
                  {/* Jam & menit dalam satu kolom — ketik manual "H:MM"/"HH:MM" */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={pickupTimeText}
                      onChange={(e) => handlePickupTimeChange(e.target.value)}
                      onBlur={normalizePickupTimeOnBlur}
                      onClick={handlePickupCaret}
                      onFocus={handlePickupCaret}
                      onKeyUp={handlePickupCaret}
                      onSelect={handlePickupCaret}
                      placeholder="07:00"
                      aria-label={t('booking.pickupAria')}
                      className="w-full h-11 px-4 pr-12 text-center border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                    />
                    <div className="absolute right-1.5 top-1.5 bottom-1.5 flex w-8 flex-col overflow-hidden rounded-lg border border-ink-600 bg-ink-800">
                      <button
                        type="button"
                        onClick={() => stepPickupSegment(1)}
                        aria-label={pickupSegment === 'minute' ? t('booking.incMinute') : t('booking.incHour')}
                        className="flex-1 flex items-center justify-center text-[10px] leading-none text-mist hover:bg-ink-700 active:bg-ink-600"
                      >
                        ▲
                      </button>
                      <span className="h-px bg-ink-600" />
                      <button
                        type="button"
                        onClick={() => stepPickupSegment(-1)}
                        aria-label={pickupSegment === 'minute' ? t('booking.decMinute') : t('booking.decHour')}
                        className="flex-1 flex items-center justify-center text-[10px] leading-none text-mist hover:bg-ink-700 active:bg-ink-600"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  {/* Periode AM/PM — ruang chevron dijaga agar tidak menumpuk teks */}
                  <select
                    value={pickupPeriod}
                    onChange={(e) => handlePickupPeriodChange(e.target.value as 'AM' | 'PM')}
                    aria-label={t('booking.periodAria')}
                    className="h-11 w-20 pl-3 pr-9 text-sm border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                {isValidPickupTime(pickupTime) &&
                  (calcLatePickupFee(pickupTime) > 0 ? (
                    <p className="text-xs text-gold-300 mt-1">
                      {t('booking.lateFeeNote', {
                        window: formatPickupWindow12h(),
                        fee: formatPrice(DRIVER_POLICY.latePickupFee),
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-green-300 mt-1">
                      {t('booking.freeNote', { window: formatPickupWindow12h() })}
                    </p>
                  ))}
                {errors.pickupTime && <p className="text-red-500 text-sm mt-1">{errors.pickupTime}</p>}
              </div>

              {/* Rincian harga sewa mobil — area tujuan diisi pada langkah "Isi Data" */}
              {isValidPickupTime(pickupTime) && (
                <div className="bg-gold-400/10 border border-gold-500/20 rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-mist">{t('booking.basePrice', { duration: rentalDuration })}</span>
                    <span className="font-medium">{formatPrice(carQuote?.base ?? 0)}</span>
                  </div>
                  {(carQuote?.latePickupFee ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-mist">{t('booking.lateFee')}</span>
                      <span className="font-medium text-gold-300">+{formatPrice(carQuote?.latePickupFee ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-gold-500/20">
                    <span>{t('booking.total')}</span>
                    <span className="text-gold-200">{formatPrice(carQuote?.total ?? 0)}</span>
                  </div>
                </div>
              )}
              {locale === 'en' && isValidPickupTime(pickupTime) && (
                <p className="text-xs text-mist-dim mt-2">{t('currency.estimateNote')}</p>
              )}
            </div>
          )}

          {/* ==== Form khusus: Antar-Jemput Bandara ==== */}
          {isTransfer && (
            <div className="mt-6 max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.directionLabel')}</label>
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
                    {t('booking.dirPickup')}
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
                    {t('booking.dirDrop')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.areaLabel')}</label>
                <select
                  value={transferArea}
                  onChange={(e) => setTransferArea(e.target.value)}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                >
                  <option value="">{t('booking.areaPlaceholder')}</option>
                  {AIRPORT_TRANSFER_RATES.map((r) => (
                    <option key={r.area} value={r.area}>
                      {r.area} — {formatPrice(r.priceSmall)}
                    </option>
                  ))}
                </select>
                {errors.transferArea && <p className="text-red-500 text-sm mt-1">{errors.transferArea}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">
                  {t('booking.paxLabel', {
                    range: formData.adults <= 5 ? t('booking.paxRangeSmall') : t('booking.paxRangeBig'),
                  })}
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 text-lg font-semibold"
                    aria-label={t('booking.decPax')}
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
                    aria-label={t('booking.incPax')}
                  >
                    +
                  </button>
                </div>
                {AIRPORT_TRANSFER_RATES.find((r) => r.area === transferArea)?.priceBig === null && formData.adults >= 6 && (
                  <p className="text-gold-300 text-xs mt-1.5">
                    {t('booking.paxLimitNote')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.flightLabel')}</label>
                <input
                  type="text"
                  value={flightNo}
                  onChange={(e) => setFlightNo(e.target.value)}
                  placeholder={t('booking.flightPlaceholder')}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                />
              </div>

              {transferArea && transferPrice !== null && transferPrice > 0 && (
                <>
                  <div className="bg-gold-400/10 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-gold-200">
                      {t('booking.fareLabel', {
                        range: formData.adults <= 5 ? t('booking.paxRangeSmall') : t('booking.paxRangeBig'),
                        dir: direction === 'PICKUP' ? t('booking.dirPickup') : t('booking.dirDrop'),
                      })}
                    </span>
                    <span className="text-xl font-bold text-gold-200">{formatPrice(transferPrice)}</span>
                  </div>
                  {locale === 'en' && (
                    <p className="text-xs text-mist-dim mt-2">{t('currency.estimateNote')}</p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleNext} variant="primary">
              {t('booking.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Data */}
      {step === 2 && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-1">
            {isCarRental ? t('booking.step2Car') : t('booking.step2Default')}
          </h2>
          <p className="text-mist-dim text-sm mb-6">{t('booking.step2Desc')}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mist mb-1">{t('booking.nameLabel')}</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder={t('booking.namePlaceholder')}
                className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
              />
              {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.emailLabel')}</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder={t('booking.emailPlaceholder')}
                  className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                />
                {errors.customerEmail && <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.phoneLabel')}</label>
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

            {/* Sewa mobil: zona penjemputan & area tujuan diketik manual */}
            {isCarRental && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-mist mb-1">{t('booking.pickupZoneLabel')}</label>
                    <input
                      type="text"
                      value={pickupZone}
                      onChange={(e) => { setPickupZone(e.target.value); clearError('pickupZone'); }}
                      placeholder={t('booking.pickupZonePlaceholder')}
                      className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                    />
                    {errors.pickupZone && <p className="text-red-500 text-sm mt-1">{errors.pickupZone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mist mb-1">{t('booking.destinationAreaLabel')}</label>
                    <input
                      type="text"
                      value={destinationArea}
                      onChange={(e) => { setDestinationArea(e.target.value); clearError('destinationArea'); }}
                      placeholder={t('booking.destinationAreaPlaceholder')}
                      className="w-full h-11 px-4 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
                    />
                    {errors.destinationArea && <p className="text-red-500 text-sm mt-1">{errors.destinationArea}</p>}
                  </div>
                </div>

                {/* Info biaya area tambahan — tidak dihitung otomatis ke total */}
                <details className="rounded-xl border border-ink-700 bg-ink-900">
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-mist">
                    {t('booking.feeInfoTitle')}
                  </summary>
                  <div className="px-4 pb-4 space-y-3 text-xs">
                    <p className="text-mist-dim leading-relaxed">
                      {t('booking.feeInfoText', {
                        areas: STANDARD_AREAS.map((a) =>
                          tOr(`sewa.standardAreas.${a.id}`, a.label).split('—')[0].trim()
                        ).join(', '),
                      })}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(remoteRegions).map(([region, areas]) => (
                        <div key={region} className="rounded-lg border border-ink-700 p-3">
                          <p className="font-semibold text-mist mb-1.5">{tOr(`sewa.regions.${region}`, region)}</p>
                          <ul className="space-y-1">
                            {areas.map((area) => (
                              <li key={area.id} className="flex items-start justify-between gap-2">
                                <span className="text-mist-dim">{area.label}</span>
                                <span className="text-gold-300 whitespace-nowrap">+{formatPrice(area.fee)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </>
            )}

            {!isSpecialService && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.adultsLabel')}</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
                    aria-label={t('booking.decAdult')}
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
                    aria-label={t('booking.incAdult')}
                  >
                    +
                  </button>
                </div>
                {errors.adults && <p className="text-red-500 text-sm mt-1">{errors.adults}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-mist mb-1">{t('booking.childrenLabel')}</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateField('children', Math.max(0, formData.children - 1))}
                    className="w-11 h-11 flex items-center justify-center border border-ink-600 rounded-l-xl bg-ink-900 text-mist hover:bg-ink-800 transition-colors text-lg font-semibold"
                    aria-label={t('booking.decChild')}
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
                    aria-label={t('booking.incChild')}
                  >
                    +
                  </button>
                </div>
                {errors.children && <p className="text-red-500 text-sm mt-1">{errors.children}</p>}
              </div>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-mist mb-1">{t('booking.notesLabel')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder={t('booking.notesPlaceholder')}
                rows={3}
                className="w-full px-4 py-2.5 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900 resize-y"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(1)} variant="outline">{t('booking.back')}</Button>
            <Button onClick={handleNext} variant="primary">{t('booking.next')}</Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Method */}
      {step === 3 && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-1">{t('booking.step3Title')}</h2>
          <p className="text-mist-dim text-sm mb-6">{t('booking.step3Desc')}</p>

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
                  <h3 className="font-semibold text-ivory">{t('booking.fullTitle')}</h3>
                  <p className="text-sm text-mist-dim mt-0.5">{t('booking.fullDesc', { total: formatPrice(grandTotal) })}</p>
                  <p className="text-xs text-mist-dim mt-1">{t('booking.fullManual')}</p>
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
                  <h3 className="font-semibold text-ivory">{t('booking.dpTitle')}</h3>
                  <p className="text-sm text-mist-dim mt-0.5">{t('booking.dpDesc', { dpPct: dpPercentage, restPct: 100 - dpPercentage })}</p>
                  <p className="text-xs text-mist-dim mt-1">{t('booking.dpManual')}</p>
                  {!installmentEnabled && (
                    <p className="text-xs text-mist-dim mt-1">{t('booking.dpUnavailable')}</p>
                  )}
                  {installmentEnabled && !installmentThresholdMet && (
                    <p className="text-xs text-gold-300 mt-1">{t('booking.dpMin', { min: formatPrice(minInstallmentAmount) })}</p>
                  )}
                </div>
              </div>

                {paymentType === 'INSTALLMENT' && (
                  <div className="mt-4 ml-9">
                    {/* Simulasi pembayaran DP: DP di muka + pelunasan (tunai ke sopir / transfer) */}
                    {(() => {
                      const dp = Math.round(grandTotal * (dpPercentage / 100));
                      const remaining = grandTotal - dp;
                      return (
                        <div className="bg-ink-850 border border-ink-700 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-mist">{t('booking.dpSimTitle')}</h4>
                          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                            <span className="text-mist-dim">{t('booking.dpSimTotal')}</span>
                            <span className="text-right font-medium">{formatPrice(grandTotal)}</span>
                            <span className="text-mist-dim">{t('booking.dpSimNow', { pct: dpPercentage })}</span>
                            <span className="text-right font-medium text-gold-300">{formatPrice(dp)}</span>
                            <span className="text-mist-dim pt-2 border-t">{t('booking.dpSimRemaining')}</span>
                            <span className="text-right font-bold text-gold-300 pt-2 border-t">{formatPrice(remaining)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
          </div>

          {locale === 'en' && (
            <p className="text-xs text-mist-dim -mt-2 mb-4">{t('currency.estimateNote')}</p>
          )}

          {paymentType === 'INSTALLMENT' && (
            <div className="mt-4 p-4 bg-gold-400/10 border border-gold-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-gold-200 mb-2">{t('booking.termsTitle')}</h4>
              <ol className="text-xs text-gold-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>{t('booking.terms1', { dpPct: dpPercentage, restPct: 100 - dpPercentage })}</li>
                <li>{t('booking.terms2')}</li>
                <li>{t('booking.terms3')}</li>
                <li>{t('booking.terms4Manual')}</li>
              </ol>
              <label className="flex items-start gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-gold-300 border-ink-600 rounded focus:ring-gold-400"
                />
                <span className="text-sm text-gold-200">
                  {t('booking.agreeLabel')}
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button onClick={() => { setStep(2); setAgreedToTerms(false); }} variant="outline">{t('booking.back')}</Button>
            <Button
              onClick={handleNext}
              variant="primary"
              disabled={paymentType === 'INSTALLMENT' && !agreedToTerms}
            >
              {t('booking.next')}
            </Button>
          </div>
          {paymentType === 'INSTALLMENT' && !agreedToTerms && (
            <p className="text-xs text-gold-300 text-right mt-2">{t('booking.agreeHint')}</p>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-ivory mb-4">{t('booking.step4Title')}</h2>

          <div className="border border-ink-700 rounded-lg p-4 space-y-3 bg-ink-900 mb-6">
            <div>
              <span className="text-sm text-mist-dim">{t('booking.serviceLabel')}</span>
              <p className="font-semibold text-ivory">{tour.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-mist-dim">{t('booking.dateLabel')}</span>
                <p className="font-medium">{fmtDate(selectedDate)}</p>
              </div>
              <div>
                <span className="text-sm text-mist-dim">{isCarRental ? t('booking.unitLabel') : isTransfer ? t('booking.passengerLabel') : t('booking.participantLabel')}</span>
                <p className="font-medium">
                  {isCarRental
                    ? t('booking.carUnit', { duration: rentalDuration })
                    : isTransfer
                      ? t('booking.peopleCount', {
                          n: formData.adults,
                          range: formData.adults <= 5 ? '1-5' : '6-10',
                        })
                      : formData.children > 0
                        ? t('booking.participantCount', { adults: formData.adults, children: formData.children })
                        : t('booking.participantCountNoChild', { adults: formData.adults })}
                </p>
              </div>
            </div>
            {isCarRental && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-mist-dim">{t('booking.pickupTimeSummary')}</span>
                  <p className="font-medium">{formatTime12h(pickupTime)} WITA</p>
                </div>
                <div>
                  <span className="text-sm text-mist-dim">{t('booking.pickupZoneSummary')}</span>
                  <p className="font-medium">{pickupZone}</p>
                </div>
              </div>
            )}
            {isCarRental && destinationArea && (
              <div>
                <span className="text-sm text-mist-dim">{t('booking.destinationAreaSummary')}</span>
                <p className="font-medium">{destinationArea}</p>
              </div>
            )}
            {isTransfer && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-mist-dim">{t('booking.dirSummary')}</span>
                  <p className="font-medium">{direction === 'PICKUP' ? t('booking.wa.routePickup') : t('booking.wa.routeDrop')}</p>
                </div>
                <div>
                  <span className="text-sm text-mist-dim">{t('booking.areaSummary')}</span>
                  <p className="font-medium">{transferArea}</p>
                </div>
              </div>
            )}
            {isTransfer && flightNo && (
              <div>
                <span className="text-sm text-mist-dim">{t('booking.flightSummary')}</span>
                <p className="font-medium">{flightNo}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-mist-dim">{t('booking.customerLabel')}</span>
              <p className="font-medium">{formData.customerName}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <span className="text-sm text-mist-dim">{t('booking.emailSummary')}</span>
                <p className="font-medium text-sm break-all">{formData.customerEmail}</p>
              </div>
              <div>
                <span className="text-sm text-mist-dim">{t('booking.phoneSummary')}</span>
                <p className="font-medium">{formData.customerPhone}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-mist-dim">{t('booking.paymentMethodLabel')}</span>
              <p className="font-medium">
                {paymentType === 'FULL'
                  ? t('booking.payFullTransfer')
                  : t('booking.payDpSummary', {
                      pct: dpPercentage,
                      mode: t('booking.payDpModeTransfer'),
                    })}
              </p>
            </div>
            {paymentType === 'INSTALLMENT' && (
              <div className="bg-gold-400/10 rounded-lg p-3 border border-gold-500/20">
                <p className="text-sm font-medium text-gold-200">{t('booking.dpDetailsTitle')}</p>
                <p className="text-xs text-gold-300 mt-1">
                  {t('booking.dpDetails', {
                    pct: dpPercentage,
                    dp: formatPrice(Math.round(grandTotal * (dpPercentage / 100))),
                    rest: formatPrice(grandTotal - Math.round(grandTotal * (dpPercentage / 100))),
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            {isCarRental ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-mist-dim">{t('booking.basePrice', { duration: rentalDuration })}</span>
                  <span>{formatPrice(carQuote?.base ?? 0)}</span>
                </div>
                {(carQuote?.latePickupFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist-dim">{t('booking.lateFee')}</span>
                    <span className="text-gold-300">+{formatPrice(carQuote?.latePickupFee ?? 0)}</span>
                  </div>
                )}
              </>
            ) : isTransfer ? (
              <div className="flex justify-between text-sm">
                <span className="text-mist-dim">
                  {t('booking.transferFare', { range: formData.adults <= 5 ? '1-5' : '6-10', area: transferArea })}
                </span>
                <span>{formatPrice(transferPrice ?? 0)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-mist-dim">{t('booking.adultPrice', { n: formData.adults, price: formatPrice(tour.priceAdult) })}</span>
                  <span>{formatPrice(tour.priceAdult * formData.adults)}</span>
                </div>
                {formData.children > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist-dim">{t('booking.childPrice', { n: formData.children, price: formatPrice(tour.priceChild) })}</span>
                    <span>{formatPrice(tour.priceChild * formData.children)}</span>
                  </div>
                )}
                {tour.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-300">
                    <span>{t('booking.discount', { pct: tour.discount })}</span>
                    <span>-{formatPrice(total * (tour.discount / 100))}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{t('booking.total')}</span>
              <span className="text-gold-300">{formatPrice(grandTotal)}</span>
            </div>
            {locale === 'en' && (
              <p className="text-xs text-mist-dim">{t('currency.estimateNote')}</p>
            )}
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
            <Button onClick={() => setStep(3)} variant="outline">{t('booking.back')}</Button>
            <Button onClick={handleSubmit} variant="accent" size="lg" isLoading={submitting}>
              {t('booking.bookNow')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Success / Invoice */}
      {step === 5 && bookingResult && (
        <div className="bg-ink-850 rounded-xl shadow-sm p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-ivory mb-2">{t('booking.successTitle')}</h2>
          <p className="text-mist-dim mb-6">
            {paymentType === 'INSTALLMENT'
              ? <>{t('booking.successManualDp')}</>
              : <>{t('booking.successManualFull')}</>}
          </p>

          <div className="bg-ink-900 rounded-lg p-6 mb-6">
            <p className="text-sm text-mist-dim mb-1">{t('booking.invoiceNoLabel')}</p>
            <p className="text-2xl font-bold text-gold-300">{bookingResult.invoiceNo}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {manualWaUrl && (
              <Button
                href={manualWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="success"
                size="lg"
              >
                {t('booking.waSend')}
              </Button>
            )}
            <Button href={`/invoice/${bookingResult.invoiceNo}`} variant="primary">
              {t('booking.viewInvoice')}
            </Button>
            <Button href="/sewa-mobil" variant="outline">
              {t('booking.viewFleet')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
