import type { Metadata } from 'next';

// Halaman booking bersifat transaksional (parameter tanggal/jam/penumpang
// menghasilkan konten dinamis) → tidak diindeks untuk mencegah konten duplikat.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
