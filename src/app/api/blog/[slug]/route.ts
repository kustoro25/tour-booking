import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.blog.findUnique({
      where: { slug, isPublished: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.blog.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: post });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
