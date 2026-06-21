import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';
const PUBLIC_ADMIN_PATHS = ['/admin/login'];

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTENT_MANAGER';

/**
 * Role-based access rules for admin paths.
 * - SUPER_ADMIN: all paths
 * - ADMIN: operations only (no users/settings management)
 * - CONTENT_MANAGER: content only (tours, destinations, blog, pages, dashboard)
 */
const ROLE_PATH_RULES: { prefix: string; allowedRoles: AdminRole[] }[] = [
  { prefix: '/admin/users',        allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/admin/settings',      allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/admin/bookings',      allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/admin/newsletter',    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
  { prefix: '/admin/reviews',       allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/admin/dashboard',     allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
  { prefix: '/admin/tours',         allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
  { prefix: '/admin/destinations',  allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
  { prefix: '/admin/blog',          allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
  { prefix: '/admin/pages',         allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
];

function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

interface JWTPayload {
  userId: string;
  email: string;
  role: AdminRole;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

function isRoleAllowed(pathname: string, role: AdminRole): boolean {
  // SUPER_ADMIN can access everything
  if (role === 'SUPER_ADMIN') return true;

  // Find matching path rule
  const matchedRule = ROLE_PATH_RULES.find((rule) => pathname.startsWith(rule.prefix));

  // If no specific rule matches, fall back to checking if any rule covers this path
  if (!matchedRule) {
    // Allow access to unmatched admin paths for any authenticated role (e.g. /admin/api routes)
    return true;
  }

  return matchedRule.allowedRoles.includes(role);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow public paths (login page)
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and extract payload
  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Check role-based access
  if (!isRoleAllowed(pathname, payload.role)) {
    // Redirect to dashboard with forbidden message
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
