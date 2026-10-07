import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, contactNotificationTemplate, contactAutoReplyTemplate } from '@/lib/email';
import { getOwnerEmail } from '@/lib/settings';
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

    // Read company info from settings (same source as admin/settings page)
    let companyName = 'HAYBALI TRANS';
    let companyEmail = 'info@haybalitrans.com';
    let companyPhone = '+6281234567890';
    try {
      const [nameSetting, emailSetting, phoneSetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: 'company_name' } }),
        prisma.setting.findUnique({ where: { key: 'company_email' } }),
        prisma.setting.findUnique({ where: { key: 'company_phone' } }),
      ]);
      if (nameSetting) { const v = JSON.parse(nameSetting.value); if (typeof v === 'string' && v.trim()) companyName = v.trim(); }
      if (emailSetting) { const v = JSON.parse(emailSetting.value); if (typeof v === 'string' && v.trim()) companyEmail = v.trim(); }
      if (phoneSetting) { const v = JSON.parse(phoneSetting.value); if (typeof v === 'string' && v.trim()) companyPhone = v.trim(); }
    } catch { /* fallback to defaults */ }

    const adminEmail = await getOwnerEmail();

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
