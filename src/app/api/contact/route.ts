import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, contactNotificationTemplate, contactAutoReplyTemplate } from '@/lib/email';
import { validateEmail } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Name, email, and message are required' }, { status: 400 });
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Nama minimal 2 karakter' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }

    if (typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Pesan minimal 10 karakter' }, { status: 400 });
    }

    const companyName = process.env.COMPANY_NAME || 'Jelajah Nusantara Tour';
    const companyEmail = process.env.COMPANY_EMAIL || 'info@tourbooking.com';
    const companyPhone = process.env.COMPANY_PHONE || '+6281234567890';
    const adminEmail = process.env.ADMIN_EMAIL || companyEmail;

    // 1. Kirim notifikasi ke admin
    try {
      await sendEmail({
        to: adminEmail,
        subject: `[Contact] ${subject || 'Pesan Baru'} - dari ${name}`,
        html: contactNotificationTemplate({
          name: name.trim(),
          email: email.trim(),
          subject: subject?.trim() || '',
          message: message.trim(),
          companyName,
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send contact notification to admin:', emailErr);
    }

    // 2. Kirim auto-reply ke pengirim (non-blocking)
    try {
      await sendEmail({
        to: email.trim(),
        subject: `Terima kasih telah menghubungi ${companyName}`,
        html: contactAutoReplyTemplate({
          name: name.trim(),
          companyName,
          companyEmail,
          companyPhone,
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send auto-reply to contact:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan Anda telah terkirim. Tim kami akan menghubungi Anda segera.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
