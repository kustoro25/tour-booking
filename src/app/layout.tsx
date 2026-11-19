import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { LanguageProvider } from '@/lib/i18n/client';
import FloatingActions from '@/components/ui/FloatingActions';
import PublicLayout from '@/components/layout/PublicLayout';
import { getBrandName, getBrandIcon, getBrandEmblem, getSiteTitle } from '@/lib/brand';
import { getWhatsAppNumber } from '@/lib/settings';
import { SITE_URL } from '@/lib/seo';
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
  const baseTitle = title.split(/\s*[-–—]\s*/)[0] || title;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Pemisah brand bisa hyphen atau em-dash (mis. "Brand — Tagline").
      template: `%s | ${baseTitle}`,
    },
    description:
      'Sewa mobil mewah dengan supir di Bali. Armada prima, supir berpengalaman, harga transparan, dan booking online cepat.',
    keywords: ['sewa mobil bali', 'rental mobil bali', 'sewa mobil dengan supir', 'haybali trans', 'supir pribadi bali', 'sewa alphard bali'],
    // Verifikasi Google Search Console (meta tag) — melengkapi verifikasi TXT DNS
    // untuk property domain haybalitrans.com dan property URL prefix.
    verification: {
      google: 'taFKYIil2fMb64C_1KL-ewBA34_PhhWG-Y7yPJO3WnE',
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: baseTitle,
      url: SITE_URL,
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      // Akhiran -v4 memaksa browser memuat ulang favicon baru (cache favicon membandel).
      icon: [
        { url: '/favicon-32x32-v4.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16-v4.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: { url: '/apple-touch-icon-v4.png', sizes: '180x180', type: 'image/png' },
    },
    manifest: '/site.webmanifest',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brandName, brandIcon, brandEmblem, waNumber, footerCms] = await Promise.all([
    getBrandName(),
    getBrandIcon(),
    getBrandEmblem(),
    getWhatsAppNumber(),
    getFooterCms(),
  ]);

  // Structured data JSON-LD: identitas situs + bisnis rental mobil untuk rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: brandName,
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'AutoRental',
        name: brandName,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/images/haybali/logo-lockup-v4.png`,
        image: `${SITE_URL}/images/haybali/hero-banner-v2.jpg`,
        telephone: `+${waNumber}`,
        areaServed: { '@type': 'Place', name: 'Bali, Indonesia' },
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'Bali',
          addressCountry: 'ID',
        },
      },
    ],
  };

  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-ink-950 text-ivory min-h-screen flex flex-col selection:bg-gold-400/25 selection:text-gold-100`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          <ToastProvider>
            <PublicLayout brandName={brandName} brandIcon={brandIcon} brandEmblem={brandEmblem} footerCms={footerCms}>{children}</PublicLayout>
            <FloatingActions waNumber={waNumber} />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
