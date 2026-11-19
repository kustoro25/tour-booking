import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// Maksimal 3 foto per review; setiap URL dibatasi panjangnya agar tidak
// menyimpan payload kacau ke kolom JSON.
const MAX_REVIEW_PHOTOS = 3;
const MAX_PHOTO_URL_LENGTH = 500;
const MAX_REVIEW_TEXT_LENGTH = 1000;

// Batasi submit review publik: 5 percobaan per IP per 15 menit.
const REVIEW_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

function isValidPhotos(photos: unknown): photos is string[] {
  if (!Array.isArray(photos)) return false;
  if (photos.length > MAX_REVIEW_PHOTOS) return false;
  return photos.every(
    (p) => typeof p === 'string' && p.length > 0 && p.length <= MAX_PHOTO_URL_LENGTH
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await prisma.order.findUnique({
      where: { reviewToken: token },
      include: {
        tour: { select: { name: true, slug: true, destination: true } },
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Link review tidak valid' }, { status: 404 });
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Review hanya bisa diberikan setelah perjalanan selesai' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ success: false, error: 'Anda sudah memberikan review untuk pesanan ini' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        customerName: order.customerName,
        tourName: order.tour.name,
        tourDate: order.tourDate,
        destination: order.tour.destination,
      },
    });
  } catch (error) {
    console.error('Get review token error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting berbasis IP (anti-spam; token UUID sendiri sudah sulit ditebak).
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const { success: allowed, resetAt } = rateLimit(`review-post:${ip}`, REVIEW_RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.` },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    const { token } = await params;
    const body = await request.json();
    const { rating, reviewText, photos } = body;

    // Find order by review token
    const order = await prisma.order.findUnique({
      where: { reviewToken: token },
      include: { review: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Link review tidak valid' }, { status: 404 });
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Review hanya bisa diberikan setelah perjalanan selesai' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ success: false, error: 'Anda sudah memberikan review untuk pesanan ini' }, { status: 400 });
    }

    // Validasi ketat: rating harus integer 1-5 (string "3" atau float ditolak
    // di sini, bukan gagal samar di Prisma).
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating harus angka bulat antara 1-5' }, { status: 400 });
    }

    if (typeof reviewText !== 'string' || reviewText.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Ulasan minimal 10 karakter' }, { status: 400 });
    }

    if (reviewText.length > MAX_REVIEW_TEXT_LENGTH) {
      return NextResponse.json({ success: false, error: `Ulasan maksimal ${MAX_REVIEW_TEXT_LENGTH} karakter` }, { status: 400 });
    }

    // photos opsional; bila dikirim harus array URL (maks 3).
    const validPhotos = photos === undefined || photos === null ? [] : photos;
    if (!isValidPhotos(validPhotos)) {
      return NextResponse.json({ success: false, error: `Foto tidak valid: maksimal ${MAX_REVIEW_PHOTOS} URL gambar` }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        tourId: order.tourId,
        rating,
        reviewText: reviewText.trim(),
        photos: JSON.stringify(validPhotos),
        status: 'PENDING', // Needs admin approval
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih! Review Anda telah dikirim dan menunggu persetujuan.',
      data: review,
    }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
