'use client';

import { useI18n } from '@/lib/i18n/client';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.floor(rating);
        const halfFilled = !filled && starValue - 0.5 <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={`${sizeClass} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            aria-label={t('review.starsLabel', { count: starValue })}
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : halfFilled ? (
              // Bintang setengah: bintang kosong sebagai dasar, separuh kiri
              // ditimpa bintang penuh yang dipotong lewat overflow-hidden.
              <span className="relative inline-block text-mist">
                ★
                <span className="absolute inset-0 w-1/2 overflow-hidden text-yellow-400 pointer-events-none">★</span>
              </span>
            ) : (
              <span className="text-mist">★</span>
            )}
          </button>
        );
      })}
      {!interactive && (
        <span className="ml-1 text-sm text-mist-dim">({rating.toFixed(1)})</span>
      )}
    </div>
  );
}
