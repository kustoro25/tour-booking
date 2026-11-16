'use client';

// Galeri foto destinasi di halaman utama. Klik gambar untuk melihat
// foto asli dalam lightbox (navigasi antar destinasi tersedia).

import { useState } from 'react';
import Image from 'next/image';
import GalleryLightbox from './GalleryLightbox';
import { useI18n } from '@/lib/i18n/client';

export interface DestinasiItem {
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

export default function DestinasiGallery({ destinations }: { destinations: DestinasiItem[] }) {
  const { t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = destinations.map((d) => ({ url: d.imageUrl, alt: d.name }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {destinations.map((dest, i) => (
          <div
            key={dest.name}
            className="group bg-ink-850 rounded-xl overflow-hidden shadow-card hover-lift border border-ink-700 hover:border-gold-500/20 transition-all"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative h-56 w-full overflow-hidden cursor-zoom-in"
              aria-label={t('ui.gallery.viewPhoto', { name: dest.name })}
            >
              <Image
                src={dest.imageUrl}
                alt={dest.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h3 className="text-xl font-bold text-ivory group-hover:text-gold-300 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-xs text-mist-dim mt-1">
                  {dest.subtitle}
                </p>
              </div>
            </button>
            <div className="p-4">
              <p className="text-sm text-mist leading-relaxed line-clamp-3">
                {dest.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <GalleryLightbox
        images={images}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}
