import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import FloatingActions from '@/components/ui/FloatingActions';
import PublicLayout from '@/components/layout/PublicLayout';
import { getBrandName, getBrandIcon, getSiteTitle } from '@/lib/brand';
import { getWhatsAppNumber } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

const inter = Inter({ subsets: ['latin'] });

// Halaman publik di-cache (ISR) supaya TTFB cepat; perubahan dari admin
// memanggil revalidatePath/revalidateTag sehingga tetap tampil langsung.
export const revalidate = 300;

/** Konten CMS footer dipakai di semua halaman → cache 5 menit, tag `cms-pages`. */
const getFooterCms = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    try {
      const footerPage = await prisma.page.findUnique({ where: { slug: 'footer' } });
      if (footerPage?.content) return JSON.parse(footerPage.content);
    } catch { /* use defaults */ }
    return {};
  },
  ['cms-footer-v1'],
  { revalidate: 300, tags: ['cms-pages'] }
);

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle();
  return {
    title: {
      default: title,
      template: `%s | ${title.split(' - ')[0] || title}`,
    },
    description:
      'Sewa mobil mewah dengan supir di Bali. Armada prima, supir berpengalaman, harga transparan, dan booking online cepat.',
    keywords: ['sewa mobil bali', 'rental mobil bali', 'sewa mobil dengan supir', 'haybali trans', 'supir pribadi bali', 'sewa alphard bali'],
    icons: {
      // Akhiran -v2 memaksa browser memuat ulang favicon baru (cache favicon membandel).
      icon: [
        { url: '/favicon-32x32-v2.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16-v2.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: { url: '/apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brandName, brandIcon, waNumber, footerCms] = await Promise.all([
    getBrandName(),
    getBrandIcon(),
    getWhatsAppNumber(),
    getFooterCms(),
  ]);

  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-ink-950 text-ivory min-h-screen flex flex-col selection:bg-gold-400/25 selection:text-gold-100`}>
        <ToastProvider>
          <PublicLayout brandName={brandName} brandIcon={brandIcon} footerCms={footerCms}>{children}</PublicLayout>
          <FloatingActions waNumber={waNumber} />
        </ToastProvider>
      </body>
    </html>
  );
}
