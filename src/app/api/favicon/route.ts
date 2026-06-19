import { NextResponse } from 'next/server';
import { getSiteFavicon } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = await getSiteFavicon();
    if (url) {
      // Redirect to Cloudinary favicon — most modern browsers handle this fine
      return NextResponse.redirect(url, { status: 302 });
    }
  } catch { /* fallback */ }

  // Default SVG favicon with brand initials
  return new NextResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#2563eb"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="white">JN</text>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  );
}
