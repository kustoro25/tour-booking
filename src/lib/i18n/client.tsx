'use client';

// ============================================================================
// Provider i18n sisi klien. Bahasa disimpan di localStorage dan dibaca via
// useSyncExternalStore: snapshot server selalu 'id' (tanpa mismatch hidrasi),
// lalu klien memakai preferensi tersimpan (pola mount-swap).
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import id from './id';
import en from './en';
import type { Dictionary } from './id';

export type Locale = 'id' | 'en';

export const LOCALES: readonly Locale[] = ['id', 'en'] as const;

const STORAGE_KEY = 'haybali-locale';

// ----------------------------------------------------------------------------
// Store eksternal sederhana untuk preferensi bahasa (localStorage). Snapshot
// bersifat primitif (string) sehingga stabil; subscribe memberi tahu React
// saat nilai berubah (setLocale atau event 'storage' lintas-tab).
// ----------------------------------------------------------------------------

const localeListeners = new Set<() => void>();

function getStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'id' || stored === 'en' ? stored : 'id';
  } catch {
    return 'id';
  }
}

function subscribeLocale(callback: () => void): () => void {
  localeListeners.add(callback);
  return () => {
    localeListeners.delete(callback);
  };
}

function setStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // abaikan bila localStorage penuh/diblokir
  }
  localeListeners.forEach((listener) => listener());
}

// Ikuti perubahan preferensi dari tab lain.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) localeListeners.forEach((listener) => listener());
  });
}

const dictionaries: Record<Locale, Dictionary> = { id, en };

/** Ambil nilai kamus lewat path bertitik, mis. 'footer.newsletterTitle'. */
function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Terjemahkan kunci path bertitik; mendukung interpolasi {var}. */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** Terjemahkan dengan fallback bila kunci tidak ada di kamus. */
  tOr: (path: string, fallback: string, vars?: Record<string, string | number>) => string;
  /** Ambil daftar teks/objek (array) dari kamus. */
  list: (path: string) => unknown[];
  /** Ambil daftar dari kamus dengan fallback bila kunci tidak ada. */
  listOr: (path: string, fallback: string[]) => string[];
}

function interpolate(raw: string, vars?: Record<string, string | number>): string {
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : match
  );
}

function lookup(path: string, locale: Locale, vars?: Record<string, string | number>): string {
  const raw = getByPath(dictionaries[locale], path);
  if (typeof raw !== 'string') return path;
  return interpolate(raw, vars);
}

function lookupList(path: string, locale: Locale): unknown[] {
  const raw = getByPath(dictionaries[locale], path);
  return Array.isArray(raw) ? (raw as unknown[]) : [];
}

function lookupOr(path: string, locale: Locale, fallback: string, vars?: Record<string, string | number>): string {
  const raw = getByPath(dictionaries[locale], path);
  if (typeof raw !== 'string') return interpolate(fallback, vars);
  return interpolate(raw, vars);
}

function lookupListOr(path: string, locale: Locale, fallback: string[]): string[] {
  const raw = getByPath(dictionaries[locale], path);
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) return raw as string[];
  return fallback;
}

// Fallback untuk komponen yang dirender di luar provider (mis. halaman admin):
// selalu bahasa Indonesia tanpa efek samping.
const fallbackValue: I18nValue = {
  locale: 'id',
  setLocale: () => {},
  t: (path, vars) => lookup(path, 'id', vars),
  tOr: (path, fallback, vars) => lookupOr(path, 'id', fallback, vars),
  list: (path) => lookupList(path, 'id'),
  listOr: (path, fallback) => lookupListOr(path, 'id', fallback),
};

const I18nContext = createContext<I18nValue>(fallbackValue);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Snapshot server selalu 'id'; klien membaca preferensi tersimpan dari
  // localStorage. React me-render ulang setelah hidrasi bila berbeda.
  const locale = useSyncExternalStore(subscribeLocale, getStoredLocale, () => 'id' as Locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => lookup(path, locale, vars),
    [locale]
  );
  const tOr = useCallback(
    (path: string, fallback: string, vars?: Record<string, string | number>) => lookupOr(path, locale, fallback, vars),
    [locale]
  );
  const list = useCallback((path: string) => lookupList(path, locale), [locale]);
  const listOr = useCallback(
    (path: string, fallback: string[]) => lookupListOr(path, locale, fallback),
    [locale]
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale: setStoredLocale, t, tOr, list, listOr }),
    [locale, t, tOr, list, listOr]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

// ----------------------------------------------------------------------------
// Sinkronkan judul tab & meta description dengan bahasa aktif. Server selalu
// merender metadata berbahasa Indonesia; saat pengguna memilih EN, hook ini
// menimpa dengan versi Inggris lalu mengembalikan nilai asli saat kembali ID.
// ----------------------------------------------------------------------------

export function useTranslatedMeta(titleEn: string, descriptionEn?: string) {
  const { locale } = useI18n();
  const originalRef = useRef<{ title: string; description: string | null } | null>(null);

  useEffect(() => {
    if (!originalRef.current) {
      const descEl = document.querySelector('meta[name="description"]');
      originalRef.current = {
        title: document.title,
        description: descEl ? descEl.getAttribute('content') : null,
      };
    }
    const original = originalRef.current;
    const desiredTitle = locale === 'en' ? titleEn : original.title;

    const applyTitle = () => {
      if (document.title !== desiredTitle) document.title = desiredTitle;
    };
    applyTitle();

    // Next.js menulis ulang <title> dari metadata server saat hidrasi/navigasi;
    // observer memastikan judul sesuai bahasa aktif tetap menang.
    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    if (descriptionEn !== undefined) {
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl) {
        descEl.setAttribute('content', locale === 'en' ? descriptionEn : (original.description ?? ''));
      }
    }

    return () => observer.disconnect();
  }, [locale, titleEn, descriptionEn]);
}
