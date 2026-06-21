import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}
const COOKIE_NAME = 'admin_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireSuperAdmin(): Promise<JWTPayload> {
  const session = await requireAdmin();
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin only');
  }
  return session;
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; user: { id: string; name: string; email: string; role: string } } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  // Verify hashed password
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) return null;

  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export function setTokenCookie(token: string) {
  // This is a helper - actual cookie setting happens in API routes / server actions
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  };
}
