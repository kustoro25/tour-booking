import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateInvoiceNo(): string {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `TRV-${year}-${randomHex.toUpperCase()}`;
}

export function generateReviewToken(): string {
  return crypto.randomUUID();
}

export function calculateTotal(
  priceAdult: number,
  priceChild: number,
  adults: number,
  children: number,
  discount: number = 0
): number {
  const subtotal = priceAdult * adults + priceChild * children;
  const discountAmount = subtotal * (discount / 100);
  return Math.max(0, subtotal - discountAmount);
}

export function getExpiryDate(hoursFromNow: number = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

const LEGACY_HUES =
  'slate|gray|zinc|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink';

const LEGACY_CLASS = new RegExp(
  `^(bg|text|border|from|via|to|ring|shadow)-(${LEGACY_HUES})-\\d{2,3}(?:\\/\\d{1,3})?$`
);

const NEUTRAL_HUES = 'slate|gray|zinc|neutral|stone';

const NOIR_REPLACEMENT: Record<string, string> = {
  bg: 'bg-gold-400/10',
  text: 'text-gold-300',
  border: 'border-gold-500/30',
  from: 'from-gold-300',
  via: 'via-gold-400',
  to: 'to-gold-600',
  ring: 'ring-gold-400/30',
  shadow: 'shadow-gold-500/25',
};

const INK_REPLACEMENT: Record<string, string> = {
  bg: 'bg-ink-800',
  text: 'text-mist',
  border: 'border-ink-700',
  from: 'from-ink-700',
  via: 'via-ink-800',
  to: 'to-ink-900',
  ring: 'ring-gold-400/30',
  shadow: 'shadow-gold-500/25',
};

const BARE_LEGACY: Record<string, string> = {
  'bg-white': 'bg-ink-850',
  'bg-black': 'bg-ink-950',
  'text-black': 'text-ivory',
  'text-gray-900': 'text-ivory',
  'text-gray-800': 'text-mist',
};

/**
 * Menormalkan kelas warna tema terang (mis. `bg-amber-50 text-amber-600`)
 * menjadi palet noir/gold. Dipakai untuk konten yang tersimpan di database.
 */
export function noirTheme(classes?: string | null): string {
  if (!classes) return '';
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => {
      if (BARE_LEGACY[cls]) return BARE_LEGACY[cls];
      const match = cls.match(LEGACY_CLASS);
      if (!match) return cls;
      const [, utility, hue] = match;
      const palette = new RegExp(`^(${NEUTRAL_HUES})$`).test(hue)
        ? INK_REPLACEMENT
        : NOIR_REPLACEMENT;
      return palette[utility];
    })
    .join(' ');
}

export const DESTINATIONS = [
  'Bali',
  'Lombok',
  'Yogyakarta',
  'Raja Ampat',
  'Labuan Bajo',
  'Bromo',
  'Bandung',
  'Malang',
  'Toraja',
  'Danau Toba',
];

export const DURATION_OPTIONS = [
  { value: '1-2', label: '1-2 Hari' },
  { value: '3-4', label: '3-4 Hari' },
  { value: '5-7', label: '5-7 Hari' },
  { value: '8+', label: '8+ Hari' },
];
