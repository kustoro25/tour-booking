import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, setTokenCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Max 5 attempts per IP per 15 minutes
const LOGIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: IP-based
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const { success, remaining, resetAt } = rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);

    if (!success) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email dan password harus diisi' }, { status: 400 });
    }

    const result = await loginAdmin(email, password);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        {
          status: 401,
          headers: { 'X-RateLimit-Remaining': String(remaining) },
        }
      );
    }

    const cookie = setTokenCookie(result.token);
    const response = NextResponse.json({
      success: true,
      data: { user: result.user },
    });

    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
  return response;
}
