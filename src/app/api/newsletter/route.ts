import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email wajib diisi' },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({
      where: { email: trimmed },
    });

    if (existing) {
      // Return success anyway for privacy (don't reveal if already subscribed)
      return NextResponse.json({
        success: true,
        message: 'Email Anda sudah terdaftar sebelumnya 🎉',
      });
    }

    // Save to database
    await prisma.newsletter.create({
      data: { email: trimmed },
    });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih! Anda telah berlangganan newsletter kami ✨',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal berlangganan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
