'use client';

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
            aria-label={`${starValue} star`}
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : halfFilled ? (
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </button>
        );
      })}
      {!interactive && (
        <span className="ml-1 text-sm text-gray-500">({rating.toFixed(1)})</span>
      )}
    </div>
  );
}
