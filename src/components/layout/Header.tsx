'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/tours', label: 'Paket Wisata' },
  { href: '/destinations', label: 'Destinasi' },
  { href: '/about', label: 'Tentang Kami' },
  { href: '/testimonials', label: 'Testimoni' },
  { href: '/contact', label: 'Hubungi Kami' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-elevated'
          : 'bg-white/90 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-shadow duration-300">
              <span className="text-white font-bold text-sm">JN</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              <span className="gradient-text">Jelajah Nusantara</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-gray-600 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button href="/tours" variant="outline" size="sm">
              Lihat Paket
            </Button>
            <Button href="/contact" variant="primary" size="sm">
              Booking Sekarang
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 pb-4 pt-2 space-y-1 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex gap-2">
              <Button href="/tours" variant="outline" size="sm" fullWidth>
                Lihat Paket
              </Button>
              <Button href="/contact" variant="primary" size="sm" fullWidth>
                Booking
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
