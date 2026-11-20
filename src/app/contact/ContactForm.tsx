'use client';

import { useState } from 'react';
import { type ContactData } from './page';
import Button from '@/components/ui/Button';
import { noirTheme } from '@/lib/utils';
import { useI18n, useTranslatedMeta } from '@/lib/i18n/client';

export default function ContactForm({ data }: { data: ContactData }) {
  const { t, locale } = useI18n();
  useTranslatedMeta(t('meta.contact'), t('meta.contactDesc'));
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Konten CMS (Indonesia) dipakai saat locale = id; saat locale = en dipakai kamus i18n.
  const label = locale === 'id' ? data.label : t('contact.label');
  const heading = locale === 'id' ? data.heading : t('contact.heading');
  const subheading = locale === 'id' ? data.subheading : t('contact.subheading');
  const infoCards = locale === 'en'
    ? data.infoCards.map((item) => {
        if (item.title === 'WhatsApp') return { ...item, title: t('contact.waTitle') };
        if (item.title === 'Email') return { ...item, title: t('contact.emailTitle') };
        if (item.title === 'Jam Operasional') return { ...item, title: t('contact.hoursTitle'), detail: t('contact.hoursDetail') };
        if (item.title === 'Alamat') return { ...item, title: t('contact.addressTitle'), detail: t('contact.addressDetail') };
        return item;
      })
    : data.infoCards;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sertakan bahasa aktif agar email balasan otomatis mengikuti pengunjung
        body: JSON.stringify({ ...form, locale }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(result.error || t('contact.sendFailed'));
      }
    } catch {
      setError(t('contact.sendError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">{label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4">{heading}</h1>
        <p className="text-mist-dim max-w-xl mx-auto">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Contact Info */}
        <div className="md:col-span-1 space-y-4">
          {infoCards.map((item) => (
            <div key={item.title} className="bg-ink-850 rounded-xl shadow-card p-5 border border-ink-700 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${noirTheme(item.color)} flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                  <span>{item.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-ivory text-sm">{item.title}</p>
                  <p className="text-sm text-mist-dim">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="bg-ink-850 rounded-xl shadow-card p-5 sm:p-8 border border-ink-700">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-ivory mb-2">{t('contact.sentTitle')}</h3>
                <p className="text-mist-dim max-w-md mx-auto">{t('contact.sentDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-mist mb-1.5">{t('contact.nameLabel')}</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow text-sm"
                      placeholder={t('contact.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mist mb-1.5">{t('contact.emailLabel')}</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow text-sm"
                      placeholder={t('contact.emailPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-mist mb-1.5">{t('contact.subjectLabel')}</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow text-sm"
                    placeholder={t('contact.subjectPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mist mb-1.5">{t('contact.messageLabel')}</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-600 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-shadow text-sm resize-none"
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={submitting}>
                  {t('contact.submit')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
