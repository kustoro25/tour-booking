'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DESTINATIONS, DURATION_OPTIONS } from '@/lib/utils';
import { TourCategoryLabels, SPECIAL_SERVICE_CATEGORIES } from '@/types';
import type { TourCategory } from '@/types';

// Kategori paket tour reguler (layanan khusus seperti sewa mobil tidak tampil di filter)
const FILTER_CATEGORIES = (Object.keys(TourCategoryLabels) as TourCategory[]).filter(
  (cat) => !SPECIAL_SERVICE_CATEGORIES.includes(cat)
);

interface TourFilterProps {
  currentDestination: string;
  currentCategory: string;
  currentSort: string;
}

export default function TourFilter({ currentDestination, currentCategory, currentSort }: TourFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/tours?${params.toString()}`);
  };

  const hasFilters =
    currentDestination ||
    currentCategory ||
    searchParams.get('duration') ||
    searchParams.get('search');

  const filterContent = (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-mist mb-1.5">
          Cari Paket
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-dim"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama paket..."
            defaultValue={searchParams.get('search') || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateFilter('search', (e.target as HTMLInputElement).value);
            }}
            className="w-full pl-9 pr-3 py-2.5 border border-ink-700 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900 hover:bg-ink-800 transition-colors"
          />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-mist mb-2">
          Destinasi
        </label>
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilter('destination', '')}
            className={`block w-full text-left px-3 h-10 rounded-lg text-sm transition-all duration-200 ${
              !currentDestination
                ? 'bg-gold-400/10 text-gold-200 font-semibold shadow-sm'
                : 'text-mist hover:bg-ink-800 hover:text-ivory'
            }`}
          >
            🌏 Semua Destinasi
          </button>
          {DESTINATIONS.map((dest) => (
            <button
              key={dest}
              onClick={() => updateFilter('destination', currentDestination === dest ? '' : dest)}
              className={`block w-full text-left px-3 h-10 rounded-lg text-sm transition-all duration-200 ${
                currentDestination === dest
                  ? 'bg-gold-400/10 text-gold-200 font-semibold shadow-sm'
                  : 'text-mist hover:bg-ink-800 hover:text-ivory'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-mist mb-2">
          Kategori
        </label>
        <div className="space-y-0.5">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left px-3 h-10 rounded-lg text-sm transition-all duration-200 ${
              !currentCategory
                ? 'bg-gold-400/10 text-gold-200 font-semibold shadow-sm'
                : 'text-mist hover:bg-ink-800 hover:text-ivory'
            }`}
          >
            📂 Semua Kategori
          </button>
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', currentCategory === cat ? '' : cat)}
              className={`block w-full text-left px-3 h-10 rounded-lg text-sm transition-all duration-200 ${
                currentCategory === cat
                  ? 'bg-gold-400/10 text-gold-200 font-semibold shadow-sm'
                  : 'text-mist hover:bg-ink-800 hover:text-ivory'
              }`}
            >
              {TourCategoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-mist mb-2">
          Durasi
        </label>
        <div className="space-y-0.5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateFilter(
                  'duration',
                  searchParams.get('duration') === opt.value ? '' : opt.value
                )
              }
              className={`block w-full text-left px-3 h-10 rounded-lg text-sm transition-all duration-200 ${
                searchParams.get('duration') === opt.value
                  ? 'bg-gold-400/10 text-gold-200 font-semibold shadow-sm'
                  : 'text-mist hover:bg-ink-800 hover:text-ivory'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-mist mb-2">
          Urutkan
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900 hover:bg-ink-800 transition-colors cursor-pointer"
        >
          <option value="newest">🆕 Terbaru</option>
          <option value="cheapest">💰 Harga Termurah</option>
          <option value="expensive">💎 Harga Termahal</option>
          <option value="rating">⭐ Rating Tertinggi</option>
        </select>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={() => router.push('/tours')}
          className="w-full text-center text-sm text-red-500 hover:text-red-300 hover:bg-red-500/10 font-medium py-2.5 rounded-xl transition-all duration-200"
        >
          ✕ Reset Semua Filter
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <div className="hidden md:block bg-ink-850 rounded-2xl shadow-card p-5 md:sticky md:top-20 border border-ink-700">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-8 h-8 bg-gold-400/15 text-gold-300 rounded-lg flex items-center justify-center text-sm">
            🔍
          </span>
          <h3 className="font-semibold text-ivory text-lg">Filter</h3>
          {hasFilters && (
            <span className="ml-auto w-2 h-2 bg-gold-500 rounded-full" />
          )}
        </div>
        {filterContent}
      </div>

      {/* ========== MOBILE FILTER BAR ========== */}
      <div className="md:hidden">
        {/* Toggle button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`w-full flex items-center justify-between bg-ink-850 rounded-2xl shadow-card p-4 border transition-all duration-200 ${
            mobileOpen ? 'border-gold-400 shadow-md' : 'border-ink-700 hover:border-ink-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-semibold text-ivory text-sm">Filter & Sort</span>
            {hasFilters && (
              <span className="bg-gold-400 text-ink-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {[
                  currentDestination ? 1 : 0,
                  currentCategory ? 1 : 0,
                  searchParams.get('duration') ? 1 : 0,
                  searchParams.get('search') ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-mist-dim transition-transform duration-300 ${mobileOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded panel */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            mobileOpen ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-ink-850 rounded-2xl shadow-card p-5 border border-ink-700 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-mist mb-1.5">🔍 Cari Paket</label>
              <input
                type="text"
                placeholder="Ketik nama paket..."
                defaultValue={searchParams.get('search') || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateFilter('search', (e.target as HTMLInputElement).value);
                }}
                className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 bg-ink-900"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-mist mb-1.5">📍 Destinasi</label>
              <select
                value={currentDestination}
                onChange={(e) => updateFilter('destination', e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm bg-ink-900 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 cursor-pointer"
              >
                <option value="">Semua Destinasi</option>
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-mist mb-1.5">📂 Kategori</label>
              <select
                value={currentCategory}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm bg-ink-900 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {FILTER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-mist mb-1.5">⏱️ Durasi</label>
              <select
                value={searchParams.get('duration') || ''}
                onChange={(e) => updateFilter('duration', e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm bg-ink-900 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 cursor-pointer"
              >
                <option value="">Semua Durasi</option>
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-mist mb-1.5">🔃 Urutkan</label>
              <select
                value={currentSort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-700 rounded-xl text-sm bg-ink-900 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 cursor-pointer"
              >
                <option value="newest">🆕 Terbaru</option>
                <option value="cheapest">💰 Harga Termurah</option>
                <option value="expensive">💎 Harga Termahal</option>
                <option value="rating">⭐ Rating Tertinggi</option>
              </select>
            </div>

            {/* Reset */}
            {hasFilters && (
              <button
                onClick={() => router.push('/tours')}
                className="w-full text-center text-sm text-red-500 hover:text-red-300 hover:bg-red-500/10 font-medium py-2.5 rounded-xl transition-all duration-200 border border-red-500/25"
              >
                ✕ Reset Semua Filter
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
