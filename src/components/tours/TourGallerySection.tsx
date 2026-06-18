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
        <div className="w-full h-56 sm:h-96 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
          <span className="text-white text-5xl sm:text-6xl">🏝️</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {/* Mobile: horizontal scroll */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-1 sm:hidden scrollbar-none">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="min-w-[85vw] h-56 snap-center flex-shrink-0 relative group cursor-zoom-in"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="85vw"
              />
              {/* Tap indicator */}
              <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full opacity-0 group-active:opacity-100 transition-opacity">
                  Tap untuk memperbesar
                </span>
              </div>
              {/* Count badge */}
              <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                {i + 1}/{images.length}
              </span>
            </button>
          ))}
        </div>

        {/* Desktop: grid layout */}
        <div className="hidden sm:grid grid-cols-2 gap-1">
          {/* Main large image */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-2 relative group cursor-zoom-in overflow-hidden"
          >
            <Image
              src={images[0].url}
              alt={images[0].alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Lihat Semua Foto
              </span>
            </div>
          </button>

          {/* Small gallery images */}
          {images.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i + 1)}
              className="relative group cursor-zoom-in overflow-hidden"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              {/* Show count if more images exist */}
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{images.length - 5} foto</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <GalleryLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
