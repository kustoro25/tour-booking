import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { getBrandName } from '@/lib/brand';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { subject, html } = await request.json();

    if (!subject || !html) {
      return NextResponse.json({ success: false, error: 'Subject dan konten wajib diisi' }, { status: 400 });
    }

    // Get all subscribers
    const subscribers = await prisma.newsletter.findMany();
    if (subscribers.length === 0) {
      return NextResponse.json({ success: false, error: 'Belum ada subscriber' }, { status: 400 });
    }

    const brandName = await getBrandName();

    // Send to each subscriber (in sequence to avoid rate limits)
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        const result = await sendEmail({
          to: sub.email,
          subject: `[${brandName}] ${subject}`,
          html: wrapNewsletterTemplate(html, brandName, sub.email),
        });
        if (result) sent++;
        else { failed++; errors.push(sub.email); }
      } catch {
        failed++;
        errors.push(sub.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter terkirim ke ${sent} dari ${subscribers.length} subscriber.`,
      data: { total: subscribers.length, sent, failed, errors: errors.slice(0, 10) },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Newsletter send error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengirim newsletter' }, { status: 500 });
  }
}

function wrapNewsletterTemplate(body: string, brandName: string, email: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 24px 32px; text-align: center;">
        <h1 style="color: #e59800; font-size: 20px; margin: 0; letter-spacing: 1px;">${brandName}</h1>
        <p style="color: #999; font-size: 11px; margin: 4px 0 0;">Newsletter</p>
      </div>
      <!-- Body -->
      <div style="padding: 32px;">
        ${body}
      </div>
      <!-- Footer -->
      <div style="background: #f5f5f5; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
        <p style="font-size: 11px; color: #999; margin: 0;">
          Email ini dikirim ke <strong>${email}</strong> karena Anda berlangganan newsletter ${brandName}.
        </p>
      </div>
    </div>
  `;
}
