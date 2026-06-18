'use client';

import Link from 'next/link';

interface GalleryPhoto {
  url: string;
  alt: string;
  destinationSlug: string;
  destinationName: string;
}

interface GalleryCarouselProps {
  photos: GalleryPhoto[];
}

function PhotoCard({ photo, index }: { photo: GalleryPhoto; index: number }) {
  return (
    <Link
      href={`/destinations/${photo.destinationSlug}`}
      className="flex-shrink-0 w-56 sm:w-64 md:w-72 mx-2 sm:mx-3 group/photo"
    >
      <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover/photo:shadow-xl group-hover/photo:ring-2 group-hover/photo:ring-blue-400 group-hover/photo:ring-offset-2 group-hover/photo:ring-offset-white">
        <img
          src={photo.url}
          alt={photo.alt}
          className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Destination name */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-semibold leading-tight drop-shadow-sm">
            {photo.destinationName}
          </p>
        </div>
        {/* Hover highlight */}
        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300" />
        {/* Hover hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300">
          <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            Lihat Destinasi
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function GalleryCarousel({ photos }: GalleryCarouselProps) {
  if (photos.length === 0) return null;

  const mid = Math.ceil(photos.length / 2);
  const topPhotos = [...photos.slice(0, mid), ...photos.slice(0, mid)];
  const bottomPhotos = [...photos.slice(mid), ...photos.slice(mid)];

  return (
    <div className="flex flex-col gap-4">
      {/* Top row — scroll left */}
      <div className="relative overflow-hidden group/row">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-transparent to-white pointer-events-none" />

        <div
          className="flex animate-scroll-left group-hover/row:[animation-play-state:paused]"
          style={{ animationDuration: '22s' }}
        >
          {topPhotos.map((photo, index) => (
            <PhotoCard key={`top-${photo.destinationSlug}-${index}`} photo={photo} index={index} />
          ))}
        </div>
      </div>

      {/* Bottom row — scroll right */}
      <div className="relative overflow-hidden group/row">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-transparent to-white pointer-events-none" />

        <div
          className="flex animate-scroll-right group-hover/row:[animation-play-state:paused]"
          style={{ animationDuration: '22s' }}
        >
          {bottomPhotos.map((photo, index) => (
            <PhotoCard key={`bottom-${photo.destinationSlug}-${index}`} photo={photo} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
