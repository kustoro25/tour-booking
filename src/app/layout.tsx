import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import FloatingActions from '@/components/ui/FloatingActions';
import PublicLayout from '@/components/layout/PublicLayout';
import { getBrandName, getBrandIcon, getSiteTitle } from '@/lib/brand';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle();
  return {
    title: {
      default: title,
      template: `%s | ${title.split(' - ')[0] || title}`,
    },
    description:
      'Platform booking tour terpercaya untuk menjelajahi destinasi terbaik di Indonesia. Harga transparan, booking instan, dan guide profesional.',
    keywords: ['tour', 'travel', 'booking', 'wisata', 'indonesia', 'liburan', 'paket tour'],
    icons: {
      icon: '/api/favicon',
    },
  };
}

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
