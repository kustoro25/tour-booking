import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import FloatingActions from '@/components/ui/FloatingActions';
import PublicLayout from '@/components/layout/PublicLayout';
import { getBrandName, getBrandIcon, getSiteTitle } from '@/lib/brand';
import { prisma } from '@/lib/prisma';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle();
  return {
    title: {
      default: title,
      template: `%s | ${title.split(' - ')[0] || title}`,
    },
    description:
      'Sewa mobil mewah & paket tur privat di Bali. Supir berpengalaman, kendaraan prima, antar-jemput bandara 24/7.',
    keywords: ['sewa mobil bali', 'tour bali', 'antar jemput bandara', 'haybali trans', 'paket wisata bali', 'supir pribadi bali'],
    icons: {
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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

  // Fetch footer CMS data server-side for instant rendering
  let footerCms: Record<string, unknown> = {};
  try {
    const footerPage = await prisma.page.findUnique({ where: { slug: 'footer' } });
    if (footerPage?.content) {
      footerCms = JSON.parse(footerPage.content);
    }
  } catch { /* use defaults */ }

  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-800 min-h-screen flex flex-col selection:bg-amber-100 selection:text-amber-900`}>
        <ToastProvider>
          <PublicLayout brandName={brandName} brandIcon={brandIcon} footerCms={footerCms}>{children}</PublicLayout>
          <FloatingActions />
        </ToastProvider>
      </body>
    </html>
  );
}
