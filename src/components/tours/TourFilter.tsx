'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DESTINATIONS, DURATION_OPTIONS } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';

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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Cari Paket
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destinasi
        </label>
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilter('destination', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              !currentDestination
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            🌏 Semua Destinasi
          </button>
          {DESTINATIONS.map((dest) => (
            <button
              key={dest}
              onClick={() => updateFilter('destination', currentDestination === dest ? '' : dest)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                currentDestination === dest
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategori
        </label>
        <div className="space-y-0.5">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              !currentCategory
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            📂 Semua Kategori
          </button>
          {(Object.keys(TourCategoryLabels) as TourCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', currentCategory === cat ? '' : cat)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                currentCategory === cat
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {TourCategoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                searchParams.get('duration') === opt.value
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urutkan
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
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
          className="w-full text-center text-sm text-red-500 hover:text-red-700 hover:bg-red-50 font-medium py-2.5 rounded-xl transition-all duration-200"
        >
          ✕ Reset Semua Filter
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-card p-5 md:sticky md:top-20 border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">
            🔍
          </span>
          <h3 className="font-semibold text-gray-900 text-lg">Filter</h3>
          {hasFilters && (
            <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
        {filterContent}
      </div>

      {/* ========== MOBILE FILTER BAR ========== */}
      <div className="md:hidden space-y-3">
        {/* Compact filter bar */}
        <div className="bg-white rounded-2xl shadow-card p-3 border border-gray-100">
          <div className="flex items-center gap-2">
            {/* Destination Dropdown */}
            <select
              value={currentDestination}
              onChange={(e) => updateFilter('destination', e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8"
            >
              <option value="">📍 Destinasi</option>
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={currentCategory}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8"
            >
              <option value="">📂 Kategori</option>
              {(Object.keys(TourCategoryLabels) as TourCategory[]).map((cat) => (
                <option key={cat} value={cat}>{TourCategoryLabels[cat]}</option>
              ))}
            </select>

            {/* Duration Dropdown */}
            <select
              value={searchParams.get('duration') || ''}
              onChange={(e) => updateFilter('duration', e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8"
            >
              <option value="">⏱️ Durasi</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Toggle expand */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                mobileOpen
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="Filter lainnya"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${mobileOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded panel */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            mobileOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
            {filterContent}
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DESTINATIONS, DURATION_OPTIONS } from '@/lib/utils';
import { TourCategoryLabels } from '@/types';
import type { TourCategory } from '@/types';

interface TourFilterProps {
  currentDestination: string;
  currentCategory: string;
  currentSort: string;
}

export default function TourFilter({ currentDestination, currentCategory, currentSort }: TourFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tours?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-6 md:sticky md:top-20">
      <h3 className="font-semibold text-gray-900 text-lg">Filter</h3>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Paket</label>
        <input
          type="text"
          placeholder="Cari nama paket..."
          defaultValue={searchParams.get('search') || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('search', (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Destinasi</label>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => updateFilter('destination', '')}
            className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
              !currentDestination ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semua Destinasi
          </button>
          {DESTINATIONS.map((dest) => (
            <button
              key={dest}
              onClick={() => updateFilter('destination', currentDestination === dest ? '' : dest)}
              className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                currentDestination === dest ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
              !currentCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semua Kategori
          </button>
          {(Object.keys(TourCategoryLabels) as TourCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', currentCategory === cat ? '' : cat)}
              className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                currentCategory === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {TourCategoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Durasi</label>
        <div className="space-y-1">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter('duration', searchParams.get('duration') === opt.value ? '' : opt.value)}
              className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                searchParams.get('duration') === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Urutkan</label>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Terbaru</option>
          <option value="cheapest">Harga Termurah</option>
          <option value="expensive">Harga Termahal</option>
          <option value="rating">Rating Tertinggi</option>
        </select>
      </div>

      {/* Reset */}
      {(currentDestination || currentCategory || searchParams.get('duration') || searchParams.get('search')) && (
        <button
          onClick={() => router.push('/tours')}
          className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}
