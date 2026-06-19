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
