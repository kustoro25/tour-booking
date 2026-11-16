'use client';

// ============================================================================
// LanguageSwitcher — tombol bahasa dengan bendera bulat + kode (mis. "ID")
// dan dropdown pilihan Indonesia / English. Pola layout website profesional:
// selalu tampil di bar atas header (desktop & mobile), dropdown rata kanan.
// ============================================================================

import { useEffect, useId, useRef, useState } from 'react';
import { LOCALES, useI18n } from '@/lib/i18n/client';
import type { Locale } from '@/lib/i18n/client';

const FLAG_CODES: Record<Locale, string> = { id: 'ID', en: 'EN' };

/** Bendera bulat SVG. Indonesia: merah-putih. English: Union Jack (ringkas). */
function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${clipId}-flag-circle`}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId}-flag-circle)`}>
        {locale === 'id' ? (
          <>
            <rect width="24" height="24" fill="#ffffff" />
            <rect width="24" height="12" fill="#e70011" />
          </>
        ) : (
          <>
            <rect width="24" height="24" fill="#012169" />
            <path d="M0 0 L24 24 M24 0 L0 24" stroke="#ffffff" strokeWidth="5" />
            <path d="M0 0 L24 24 M24 0 L0 24" stroke="#c8102e" strokeWidth="2.4" />
            <path d="M12 0 V24 M0 12 H24" stroke="#ffffff" strokeWidth="7" />
            <path d="M12 0 V24 M0 12 H24" stroke="#c8102e" strokeWidth="4" />
          </>
        )}
      </g>
      <circle cx="12" cy="12" r="11.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const optionLabel: Record<Locale, string> = {
    id: t('switcher.indonesia'),
    en: t('switcher.english'),
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('switcher.label')}
        className="flex items-center gap-2 rounded-full border border-gold-500/30 bg-ink-900/70 px-2 py-1.5 sm:px-2.5 text-sm font-bold text-ivory transition-colors hover:border-gold-400/70 hover:text-gold-300"
      >
        <FlagIcon locale={locale} className="h-5 w-5 shrink-0" />
        <span className="leading-none">{FLAG_CODES[locale]}</span>
        <svg
          className={`h-3.5 w-3.5 text-gold-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('switcher.label')}
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gold-500/20 bg-ink-900 p-1.5 shadow-elevated animate-fade-in"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === locale}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                l === locale
                  ? 'bg-gold-400/15 font-semibold text-gold-200'
                  : 'text-mist hover:bg-ink-800 hover:text-gold-200'
              }`}
            >
              <FlagIcon locale={l} className="h-5 w-5 shrink-0" />
              <span>{optionLabel[l]}</span>
              {l === locale && (
                <svg
                  className="ml-auto h-4 w-4 text-gold-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
