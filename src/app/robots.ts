import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Area privat/dinamis yang tidak relevan untuk indeks pencarian.
        disallow: ['/admin', '/api/', '/invoice/', '/review/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
