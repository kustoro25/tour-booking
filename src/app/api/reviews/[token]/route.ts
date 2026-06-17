import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ success: false, error: 'Review hanya bisa diberikan setelah tour selesai' }, { status: 400 });
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
      return NextResponse.json({ success: false, error: 'Review hanya bisa diberikan setelah tour selesai' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ success: false, error: 'Anda sudah memberikan review untuk pesanan ini' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating harus antara 1-5' }, { status: 400 });
    }

    if (!reviewText || reviewText.length < 10) {
      return NextResponse.json({ success: false, error: 'Ulasan minimal 10 karakter' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        tourId: order.tourId,
        rating,
        reviewText,
        photos: JSON.stringify(photos || []),
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
