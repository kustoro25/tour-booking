// ============================================================================
// Format harga & konversi mata uang. Semua nominal disimpan dalam IDR; saat
// bahasa English aktif, harga publik ditampilkan sebagai estimasi USD dengan
// kurs terkini (setting admin / kurs live / env / konstanta cadangan).
// ============================================================================

/** Kurs cadangan bila setting admin kosong dan sumber lain gagal. */
export const DEFAULT_USD_RATE = 16300;

/** Kurs dianggap valid bila berupa angka positif yang wajar. */
export function isValidUsdRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 1000;
}

/** Format nominal IDR menjadi estimasi USD (dibulatkan ke dollar utuh). */
export function formatUsdFromIdr(amountIdr: number, rate: number): string {
  const safeRate = isValidUsdRate(rate) ? rate : DEFAULT_USD_RATE;
  const usd = Math.round(amountIdr / safeRate);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usd);
}
