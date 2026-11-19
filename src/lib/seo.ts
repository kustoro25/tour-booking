// ============================================================================
// SEO: URL kanonik produksi untuk metadataBase, sitemap, robots, dan JSON-LD.
// Prioritas: env NEXT_PUBLIC_SITE_URL (produksi) > default haybalitrans.com.
// Nilai localhost diabaikan supaya metadata hasil build lokal tidak bocor
// ke halaman produksi (mis. saat env belum di-set di environment tertentu).
// ============================================================================

const FALLBACK_SITE_URL = 'https://haybalitrans.com';

export const SITE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return FALLBACK_SITE_URL;
})();
