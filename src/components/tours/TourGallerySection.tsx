'use client';

import { useState } from 'react';
import Image from 'next/image';
import GalleryLightbox from './GalleryLightbox';

interface TourGallerySectionProps {
  images: { url: string; alt: string }[];
  tourName: string;
}

export default function TourGallerySection({ images, tourName }: TourGallerySectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="w-full h-56 sm:h-80 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
          <span className="text-white text-5xl sm:text-6xl">🏝️</span>
        </div>
      </div>
    );
  }

  // Layout strategy based on image count
  const mainImage = images[0];
  const thumbnails = images.slice(1, 5); // max 4 thumbnails
  const hasMore = images.length > 5;

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {/* === MOBILE: horizontal scroll carousel === */}
        <div className="sm:hidden relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className="min-w-full w-full h-64 snap-center flex-shrink-0 relative"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Count badge */}
                <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  {i + 1}/{images.length}
                </span>
              </button>
            ))}
          </div>
          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/60"
              />
            ))}
          </div>
        </div>

        {/* === DESKTOP: elegant masonry-style grid === */}
        <div className="hidden sm:block">
          {images.length === 1 ? (
            /* Single image */
            <button
              onClick={() => openLightbox(0)}
              className="w-full aspect-[16/9] relative group cursor-zoom-in overflow-hidden"
            >
              <Image
                src={mainImage.url}
                alt={mainImage.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Lihat Foto
                </span>
              </div>
            </button>
          ) : (
            /* 2+ images: main large + thumbnails grid */
            <div className="flex flex-col md:flex-row gap-1">
              {/* Main large image */}
              <button
                onClick={() => openLightbox(0)}
                className="w-full md:w-3/5 aspect-[16/10] md:aspect-auto md:h-full min-h-[320px] relative group cursor-zoom-in overflow-hidden"
              >
                <Image
                  src={mainImage.url}
                  alt={mainImage.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black/50 backdrop-blur-sm px-5 py-2.5 rounded-xl text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Lihat Semua Foto
                  </span>
                </div>
              </button>

              {/* Thumbnail grid (2x2) */}
              <div className="w-full md:w-2/5 grid grid-cols-2 gap-1">
                {thumbnails.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(i + 1)}
                    className="relative group cursor-zoom-in overflow-hidden aspect-[4/3]"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 1024px) 50vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <svg className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    {/* Show "+N" overlay on last thumbnail */}
                    {i === 3 && hasMore && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-white font-bold text-xl sm:text-2xl">+{images.length - 5}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox modal */}
      <GalleryLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
