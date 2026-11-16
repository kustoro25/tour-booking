'use client';

// ============================================================================
// AboutClient — renderer klien halaman /tentang-kami. Konten CMS (Indonesia)
// dipakai saat locale = id; saat locale = en dipakai kamus i18n.
// ============================================================================

import { noirTheme } from '@/lib/utils';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

export interface AboutData {
  label: string;
  heading: string;
  storyTitle: string;
  story: string;
  vision: string;
  mission: string[];
  whyUs: { icon: string; title: string; desc: string; color: string }[];
}

interface AboutClientProps {
  data: AboutData;
}

export default function AboutClient({ data }: AboutClientProps) {
  const { t, list, locale } = useI18n();
  useTranslatedMeta(t('meta.about'), t('meta.aboutDesc'));

  const label = locale === 'id' ? data.label : t('about.label');
  const heading = locale === 'id' ? data.heading : t('about.heading');
  const storyTitle = locale === 'id' ? data.storyTitle : t('about.storyTitle');
  const visionTitle = t('about.visionTitle');
  const vision = locale === 'id' ? data.vision : t('about.vision');
  const missionTitle = t('about.missionTitle');
  const mission = locale === 'id' ? data.mission : (list('about.mission') as string[]);
  const whyTitle = t('about.whyTitle');
  const whyUs = locale === 'id' ? data.whyUs : (list('about.whyUs') as AboutData['whyUs']);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory">{heading}</h1>
      </div>

      <div className="bg-ink-850 rounded-xl shadow-card p-5 sm:p-8 mb-8 border border-ink-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 bg-gold-400/15 text-gold-300 rounded-xl flex items-center justify-center text-lg">📖</span>
          <h2 className="text-xl font-semibold text-ivory">{storyTitle}</h2>
        </div>
        {locale === 'en' ? (
          (list('about.story') as string[]).map((paragraph, i) => (
            <p key={i} className="text-mist leading-relaxed mb-4 last:mb-0">
              {i === 0 ? (
                <>
                  <strong className="text-gold-300">HAYBALI TRANS</strong>{' '}
                  {paragraph.replace(/^HAYBALI TRANS /, '')}
                </>
              ) : (
                paragraph
              )}
            </p>
          ))
        ) : (
          data.story.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-mist leading-relaxed mb-4 last:mb-0">
              {i === 0 ? (
                <>
                  <strong className="text-gold-300">HAYBALI TRANS</strong>{' '}
                  {paragraph.replace(/^HAYBALI TRANS adalah /, 'adalah ')}
                </>
              ) : (
                paragraph
              )}
            </p>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gold-400/10 to-ink-850 rounded-xl shadow-card p-5 sm:p-8 border border-gold-500/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 rounded-xl flex items-center justify-center text-lg shadow-sm">🎯</span>
            <h2 className="text-xl font-semibold text-ivory">{visionTitle}</h2>
          </div>
          <p className="text-mist leading-relaxed">{vision}</p>
        </div>
        <div className="bg-gradient-to-br from-gold-400/10 to-ink-850 rounded-xl shadow-card p-5 sm:p-8 border border-gold-500/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 rounded-xl flex items-center justify-center text-lg shadow-sm">🚀</span>
            <h2 className="text-xl font-semibold text-ivory">{missionTitle}</h2>
          </div>
          <ul className="space-y-2 text-mist">
            {mission.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gold-400 mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-ink-850 rounded-xl shadow-card p-5 sm:p-8 border border-ink-700">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-9 bg-gold-400/15 text-gold-300 rounded-xl flex items-center justify-center text-lg">⭐</span>
          <h2 className="text-xl font-semibold text-ivory">{whyTitle}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {whyUs.map((item) => (
            <div key={item.title} className="flex gap-3 p-3 rounded-xl hover:bg-ink-800 transition-colors">
              <span className={`w-10 h-10 rounded-lg ${noirTheme(item.color)} flex items-center justify-center text-xl flex-shrink-0`}>
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-ivory text-sm">{item.title}</h3>
                <p className="text-sm text-mist-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
