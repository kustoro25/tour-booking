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
