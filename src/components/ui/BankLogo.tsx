'use client';

// Logo bank untuk baris rekening di invoice & halaman pembayaran.
// Hanya bank yang punya aset di sini yang ditampilkan logonya; lainnya jatuh
// kembali ke teks nama bank (lihat getBankLogo).

import Image from 'next/image';

const BANK_LOGOS: Record<string, string> = {
  BCA: '/images/banks/bca-logo.png',
};

/** Path logo berdasarkan nama bank; null bila belum tersedia. */
export function getBankLogo(bank: string): string | null {
  return BANK_LOGOS[(bank || '').trim().toUpperCase()] ?? null;
}

export default function BankLogo({ bank, className = '' }: { bank: string; className?: string }) {
  const src = getBankLogo(bank);
  if (!src) return null;

  return (
    <span className={`inline-flex items-center justify-center rounded bg-white px-1.5 py-1 ${className}`}>
      <Image
        src={src}
        alt={`Logo ${bank}`}
        width={100}
        height={32}
        className="h-5 w-auto object-contain"
      />
    </span>
  );
}
