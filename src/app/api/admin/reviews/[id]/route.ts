import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePublicSite } from '@/lib/revalidate';
import { cloudinary } from '@/lib/cloudinary';

const VALID_REVIEW_STATUSES = ['PENDING', 'APPROVED', 'HIDDEN'] as const;
type ReviewStatus = (typeof VALID_REVIEW_STATUSES)[number];

/** Parse kolom photos (JSON string) menjadi array URL yang aman. */
function parsePhotoUrls(photos: string): string[] {
  try {
    const parsed = JSON.parse(photos);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.length > 0);
  } catch {
    return [];
  }
}

/**
 * Ambil public_id Cloudinary dari URL gambar review.
 * Pola: /<cloud>/image/upload/[v<versi>/]<folder>/<public_id>.<ext>
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('cloudinary.com')) return null;
    const match = u.pathname.match(/^\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, adminReply } = body;

    // Validate status enum
    if (status && !VALID_REVIEW_STATUSES.includes(status as ReviewStatus)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Gunakan: ${VALID_REVIEW_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminReply !== undefined) {
      if (typeof adminReply !== 'string') {
        return NextResponse.json({ success: false, error: 'Balasan admin harus berupa teks' }, { status: 400 });
      }
      updateData.adminReply = adminReply.trim() || null;
    }

    // Tolak update kosong agar tidak melempar error Prisma yang membingungkan.
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim' }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    revalidatePublicSite();
    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review tidak ditemukan' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    // Hapus foto review dari Cloudinary agar tidak menjadi file yatim.
    // Best-effort: kegagalan Cloudinary tidak menggagalkan penghapusan review.
    const photoUrls = parsePhotoUrls(review.photos);
    await Promise.allSettled(
      photoUrls.map((url) => {
        const publicId = extractCloudinaryPublicId(url);
        if (!publicId) return Promise.resolve();
        return cloudinary.uploader
          .destroy(publicId, { resource_type: 'image' })
          .then((result) => {
            if (result.result !== 'ok' && result.result !== 'not found') {
              throw new Error(`Cloudinary destroy gagal untuk ${publicId}: ${result.result}`);
            }
          });
      })
    ).then((results) => {
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('Gagal hapus foto review di Cloudinary:', r.reason);
      });
    });

    revalidatePublicSite();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
