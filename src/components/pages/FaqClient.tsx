'use client';

// ============================================================================
// FaqClient — renderer klien halaman /faq. Teks dari kamus i18n (id/en);
// jawaban metode pembayaran menyesuaikan mode gateway dari server.
// ============================================================================

import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

interface FaqClientProps {
  gateway: 'midtrans' | 'manual';
}

export default function FaqClient({ gateway }: FaqClientProps) {
  const { t, list } = useI18n();
  useTranslatedMeta(t('meta.faq'), t('meta.faqDesc'));
  const faqs = (list('faq.items') as { q: string; a: string }[]).map((faq, index) =>
    index === 2
      ? { ...faq, a: gateway === 'midtrans' ? t('faq.paymentMidtrans') : t('faq.paymentManual') }
      : faq
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{t('faq.label')}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4">
          {t('faq.title')}
        </h1>
        <p className="text-mist-dim max-w-2xl mx-auto">
          {t('faq.desc')}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="bg-ink-850 rounded-xl shadow-card group overflow-hidden border border-ink-700 hover:border-gold-500/20 transition-colors"
          >
            <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-ivory hover:text-gold-300 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 bg-gold-400/10 text-gold-300 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {faq.q}
              </span>
              <svg
                className="w-5 h-5 text-mist-dim group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-5 sm:px-6 pb-5 text-mist leading-relaxed text-sm sm:text-base border-t border-ink-700 pt-4 ml-14 sm:ml-16">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
