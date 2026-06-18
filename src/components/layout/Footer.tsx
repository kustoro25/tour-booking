'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

function useCompanyInfo() {
  const [info, setInfo] = useState({ email: 'info@jelajahnusantara.com', phone: '+62 812-3456-7890' });
  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) setInfo(data.data);
      })
      .catch(() => {});
  }, []);
  return info;
}

const footerLinks = {
  Navigasi: [
    { href: '/', label: 'Beranda' },
    { href: '/tours', label: 'Paket Wisata' },
    { href: '/destinations', label: 'Destinasi' },
    { href: '/about', label: 'Tentang Kami' },
    { href: '/testimonials', label: 'Testimoni' },
    { href: '/contact', label: 'Hubungi Kami' },
  ],
  Bantuan: [
    { href: '/terms', label: 'Syarat & Ketentuan' },
    { href: '/privacy', label: 'Kebijakan Privasi' },
  ],
};

export default function Footer() {
  const info = useCompanyInfo();
  const { showToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterEmail('');
        showToast(data.message || 'Berhasil berlangganan!', 'success');
      } else {
        showToast(data.error || 'Gagal berlangganan', 'error');
      }
    } catch {
      showToast('Gagal berlangganan. Silakan coba lagi.', 'error');
    } finally {
      setSubscribing(false);
    }
  };
  return (
    <footer className="bg-gray-900 text-gray-300 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-bold text-sm">JN</span>
              </div>
              <span className="text-xl font-bold text-white">Jelajah Nusantara</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md leading-relaxed">
              Platform booking tour terpercaya untuk menjelajahi destinasi terbaik di Indonesia.
              Harga transparan, booking instan, dan guide profesional.
            </p>
            <div className="space-y-1.5 text-sm text-gray-400 mb-4">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">📍</span>
                <span>{'Jl. Pariwisata No. 123, Jakarta Selatan'}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="flex-shrink-0">📞</span>
                <span>{info.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="flex-shrink-0">📧</span>
                <span>{info.email}</span>
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'WhatsApp', d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' },
                { label: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { label: 'Email', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', stroke: true },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                >
                  {s.stroke ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={s.d} /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
                  )}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h4 className="text-white font-semibold text-sm mb-2">
                Dapatkan Info Terbaru ✉️
              </h4>
              <p className="text-gray-400 text-xs mb-3">
                Berlangganan newsletter untuk info promo & paket terbaru.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="email@anda.com"
                  required
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  {subscribing ? '...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* Nav Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4 relative inline-block">
                {category}
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full" />
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-all duration-200 text-sm hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Jelajah Nusantara Tour. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
