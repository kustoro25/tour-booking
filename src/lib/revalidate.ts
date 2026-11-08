import { revalidatePath, revalidateTag } from 'next/cache';
import { SETTINGS_CACHE_TAG } from './settings';

/**
 * Halaman publik kini memakai ISR (revalidate 300s) agar cepat.
 * Panggil helper ini setiap admin menyimpan konten/setting supaya
 * perubahan langsung terlihat tanpa menunggu masa revalidate.
 */
export function revalidatePublicSite(): void {
  revalidatePath('/', 'layout');
  revalidateTag('cms-pages', 'max');
  revalidateTag(SETTINGS_CACHE_TAG, 'max');
}
