export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,15}$/.test(phone);
}

export function validateRequired(value: string, minLength = 1): boolean {
  return value.trim().length >= minLength;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateBookingForm(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adults: number;
  children: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!validateRequired(data.customerName, 3)) {
    errors.customerName = 'Nama lengkap minimal 3 karakter';
  }
  if (!validateEmail(data.customerEmail)) {
    errors.customerEmail = 'Format email tidak valid';
  }
  if (!validatePhone(data.customerPhone)) {
    errors.customerPhone = 'Format nomor HP tidak valid (min. 8 digit)';
  }
  if (data.adults < 1) {
    errors.adults = 'Minimal 1 peserta dewasa';
  }
  if (data.children < 0) {
    errors.children = 'Jumlah anak tidak valid';
  }

  return errors;
}

export function validateTourForm(data: {
  name: string;
  slug: string;
  category: string;
  destination: string;
  duration: string;
  priceAdult: number;
  priceChild: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!validateRequired(data.name, 3)) errors.name = 'Nama paket minimal 3 karakter';
  if (!validateRequired(data.slug, 3)) errors.slug = 'Slug URL harus diisi';
  if (!data.category) errors.category = 'Kategori harus dipilih';
  if (!data.destination) errors.destination = 'Destinasi harus dipilih';
  if (!validateRequired(data.duration)) errors.duration = 'Durasi harus diisi';
  if (data.priceAdult < 0) errors.priceAdult = 'Harga dewasa tidak valid';
  if (data.priceChild < 0) errors.priceChild = 'Harga anak tidak valid';

  return errors;
}
