import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

interface GooglePlaceResponse {
  status: string;
  error_message?: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReview[];
  };
}

// Simple in-memory cache
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    // Read settings
    const settingRecords = await prisma.setting.findMany({
      where: {
        key: {
          in: ['google_reviews_enabled', 'google_place_id', 'google_api_key', 'google_reviews_count', 'google_reviews_min_rating'],
        },
      },
    });

    const settings: Record<string, unknown> = {};
    for (const s of settingRecords) {
      try { settings[s.key] = JSON.parse(s.value); } catch { settings[s.key] = s.value; }
    }

    const enabled = settings['google_reviews_enabled'] === true || settings['google_reviews_enabled'] === 'true';
    const placeId = (settings['google_place_id'] as string) || '';
    const apiKey = (settings['google_api_key'] as string) || '';
    const maxReviews = Number(settings['google_reviews_count']) || 5;

    if (!enabled || !placeId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Google Reviews not configured or disabled',
        data: null,
      });
    }

    // Fetch from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews,rating,user_ratings_total&key=${encodeURIComponent(apiKey)}&language=id&reviews_no_translation=true`;

    const response = await fetch(url);
    const json: GooglePlaceResponse = await response.json();

    if (json.status !== 'OK') {
      return NextResponse.json({
        success: false,
        error: json.error_message || `Google API error: ${json.status}`,
        data: null,
      });
    }

    const result = json.result;
    if (!result || !result.reviews || result.reviews.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          placeRating: result?.rating || 0,
          totalRatings: result?.user_ratings_total || 0,
          reviews: [],
        },
      });
    }

    // Filter by min rating, slice to max, and format
    const minRating = Number(settings['google_reviews_min_rating']) || 1;
    const filteredReviews = result.reviews
      .filter((r) => r.rating >= minRating)
      .slice(0, maxReviews)
      .map((r) => ({
        authorName: r.author_name,
        authorUrl: r.author_url || null,
        profilePhoto: r.profile_photo_url || null,
        rating: r.rating,
        text: r.text,
        time: new Date(r.time * 1000).toISOString(),
        relativeTime: r.relative_time_description,
      }));

    const responseData = {
      placeRating: result.rating || 0,
      totalRatings: result.user_ratings_total || 0,
      placeUrl: `https://search.google.com/local/reviews?placeid=${placeId}`,
      reviews: filteredReviews,
    };

    // Update cache
    cache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Google Reviews API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', data: null }, { status: 500 });
  }
}
