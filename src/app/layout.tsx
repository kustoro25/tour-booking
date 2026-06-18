import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import FloatingActions from '@/components/ui/FloatingActions';
import PublicLayout from '@/components/layout/PublicLayout';
import { getBrandName, getBrandIcon } from '@/lib/brand';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Jelajah Nusantara - Booking Tour & Aktivitas',
    template: '%s | Jelajah Nusantara',
  },
  description:
    'Platform booking tour terpercaya untuk menjelajahi destinasi terbaik di Indonesia. Harga transparan, booking instan, dan guide profesional.',
  keywords: ['tour', 'travel', 'booking', 'wisata', 'indonesia', 'liburan', 'paket tour'],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brandName = await getBrandName();
  const brandIcon = await getBrandIcon();
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-800 min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900`}>
        <ToastProvider>
          <PublicLayout brandName={brandName} brandIcon={brandIcon}>{children}</PublicLayout>
          <FloatingActions />
        </ToastProvider>
      </body>
    </html>
  );
}
