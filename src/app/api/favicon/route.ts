import { NextResponse } from 'next/server';
import { getSiteFavicon } from '@/lib/brand';

export const dynamic = 'force-dynamic';

async function defaultFavicon() {
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#f59e0b"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="white">HB</text>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    }
  );
}

export async function GET() {
  try {
    const url = await getSiteFavicon();
    if (url) {
      // Fetch the image from Cloudinary and proxy it directly
      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png';
        const body = await res.arrayBuffer();
        return new NextResponse(body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        });
      }
    }
  } catch { /* fallback */ }

  return defaultFavicon();
}
