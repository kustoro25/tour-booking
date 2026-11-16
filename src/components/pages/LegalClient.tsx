'use client';

// ============================================================================
// LegalClient — renderer klien halaman /terms dan /privacy. Konten CMS
// (Indonesia) dipakai saat locale = id; saat locale = en dipakai HTML bawaan
// dari kamus i18n (diterjemahkan).
// ============================================================================

import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface LegalClientProps {
  kind: 'terms' | 'privacy';
  /** Konten HTML dari CMS (bahasa Indonesia), atau null bila belum diatur. */
  cmsHtml: string | null;
}

export default function LegalClient({ kind, cmsHtml }: LegalClientProps) {
  const { t, locale } = useI18n();
  useTranslatedMeta(kind === 'terms' ? t('meta.terms') : t('meta.privacy'));
  const title = t(`${kind}.title`);
  const html = locale === 'en' ? t(`${kind}.bodyHtml`) : cmsHtml || t(`${kind}.bodyHtml`);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4 text-center">{title}</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
