'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    // Tampilkan tombol setelah scroll > 400px
    setVisible(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className={`
        fixed bottom-6 right-6 z-50
        w-11 h-11 sm:w-12 sm:h-12
        rounded-full
        bg-gradient-to-br from-blue-600 to-teal-600
        text-white
        shadow-lg shadow-blue-500/30
        hover:shadow-xl hover:shadow-blue-500/40 hover:scale-110
        active:scale-95
        flex items-center justify-center
        transition-all duration-300 ease-out
        ${visible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-16 opacity-0 pointer-events-none'}
      `}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}
