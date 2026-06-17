import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, setTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email dan password harus diisi' }, { status: 400 });
    }

    const result = await loginAdmin(email, password);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Email atau password salah' }, { status: 401 });
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
