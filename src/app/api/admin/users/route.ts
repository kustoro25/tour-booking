import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        // Exclude password
      },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden: Super Admin only') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { name, email, phone, role, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role || 'ADMIN',
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden: Super Admin only') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    // Prevent deleting the last super admin
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        return NextResponse.json({ success: false, error: 'Tidak dapat menghapus satu-satunya Super Admin' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden: Super Admin only') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
