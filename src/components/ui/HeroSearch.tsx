'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SUGGESTIONS = [
  { label: '🏝️ Bali', query: 'Bali' },
  { label: '⛰️ Bromo', query: 'Bromo' },
  { label: '🏛️ Yogyakarta', query: 'Yogyakarta' },
  { label: '🐠 Raja Ampat', query: 'Raja Ampat' },
  { label: '🦎 Labuan Bajo', query: 'Labuan Bajo' },
  { label: '🌋 Bandung', query: 'Bandung' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/tours?search=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const filteredSuggestions = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.query.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl z-30">
      <div
        className={`
          flex items-center bg-white rounded-2xl shadow-glow-blue overflow-hidden
          border-2 transition-all duration-300
          ${showSuggestions ? 'border-blue-400 shadow-lg shadow-blue-500/20' : 'border-white/50 hover:border-blue-300'}
        `}
      >
        {/* Search Icon */}
        <div className="pl-4 sm:pl-5 flex-shrink-0">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Cari destinasi impianmu..."
          className="flex-1 px-3 sm:px-4 py-3 sm:py-4 text-gray-800 placeholder-gray-400 bg-transparent outline-none text-sm sm:text-base"
        />

        {/* Search Button */}
        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="mr-1.5 sm:mr-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95 flex-shrink-0"
        >
          Cari
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-50 animate-fade-in max-h-56 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            <div className="py-1.5">
              <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {query.trim() ? 'Hasil Pencarian' : 'Destinasi Populer'}
              </p>
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.query}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion.query);
                    setShowSuggestions(false);
                    router.push(`/tours?search=${encodeURIComponent(suggestion.query)}`);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              Tidak ada destinasi yang cocok
            </div>
          )}
        </div>
      )}
    </div>
  );
}
