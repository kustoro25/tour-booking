// Email service - uses nodemailer for SMTP delivery
// Falls back to console logging in development when no SMTP config is set

import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const smtpTransport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const from = process.env.EMAIL_FROM || 'booking@tourbooking.com';

  // If SMTP credentials are configured, send real email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const info = await smtpTransport.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Jelajah Nusantara'}" <${from}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Fallback: log to console (development mode without credentials)
  console.log('=== EMAIL (DEV MODE - no SMTP config) ===');
  console.log(`From: ${from}`);
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Body: ${payload.html}`);
  console.log('==========================================');
  return true;
}

export function invoiceEmailTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  tourDate: string;
  total: string;
  expiryDate: string;
  paymentUrl: string;
  companyName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Booking Berhasil!</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Terima kasih telah memilih <strong>${data.companyName}</strong>. Berikut adalah detail pesanan Anda:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>Invoice</strong></td><td>${data.invoiceNo}</td></tr>
        <tr><td><strong>Paket</strong></td><td>${data.tourName}</td></tr>
        <tr><td><strong>Tanggal</strong></td><td>${data.tourDate}</td></tr>
        <tr><td><strong>Total</strong></td><td style="font-size: 18px; font-weight: bold;">${data.total}</td></tr>
        <tr><td><strong>Batas Pembayaran</strong></td><td style="color: #F97316;">${data.expiryDate}</td></tr>
      </table>
      <br/>
      <a href="${data.paymentUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Bayar Sekarang</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Mohon lakukan pembayaran sebelum batas waktu agar pesanan tidak otomatis dibatalkan.</p>
    </div>
  `;
}

export function paymentConfirmationTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  tourDate: string;
  companyName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Pembayaran Dikonfirmasi!</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Pembayaran Anda untuk pesanan <strong>${data.invoiceNo}</strong> telah kami terima.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>Paket</strong></td><td>${data.tourName}</td></tr>
        <tr><td><strong>Tanggal Tour</strong></td><td>${data.tourDate}</td></tr>
      </table>
      <br/>
      <p>E-Ticket dan informasi selengkapnya akan dikirimkan segera.</p>
      <p>Sampai jumpa di hari keberangkatan!</p>
      <p>Salam,<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}

export function contactNotificationTemplate(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  companyName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">📩 Pesan Baru dari Contact Form</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0;"><strong>Nama</strong></td><td>${data.name}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Email</strong></td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
        <tr><td style="padding: 8px 0;"><strong>Subjek</strong></td><td>${data.subject || '(Tidak diisi)'}</td></tr>
      </table>
      <div style="background: #F3F4F6; padding: 16px; border-radius: 8px;">
        <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Pesan ini dikirim melalui contact form website ${data.companyName}.</p>
    </div>
  `;
}

export function contactAutoReplyTemplate(data: {
  name: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Terima Kasih telah Menghubungi Kami!</h2>
      <p>Halo <strong>${data.name}</strong>,</p>
      <p>Terima kasih telah menghubungi <strong>${data.companyName}</strong>. Pesan Anda telah kami terima dan tim kami akan segera menghubungi Anda.</p>
      <p>Waktu respons kami biasanya dalam <strong>1x24 jam</strong> pada hari kerja.</p>
      <p>Jika ada hal mendesak, silakan hubungi kami langsung:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <tr><td style="padding: 4px 0;">📧 <strong>Email</strong></td><td><a href="mailto:${data.companyEmail}">${data.companyEmail}</a></td></tr>
        <tr><td style="padding: 4px 0;">📱 <strong>WhatsApp</strong></td><td>${data.companyPhone}</td></tr>
      </table>
      <p style="margin-top: 20px;">Salam hangat,<br/><strong>Tim ${data.companyName}</strong></p>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
    </div>
  `;
}

export function reviewRequestTemplate(data: {
  customerName: string;
  tourName: string;
  reviewUrl: string;
  companyName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F97316;">⭐ Bagaimana Liburan Anda?</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Semoga Anda menikmati perjalanan <strong>${data.tourName}</strong> bersama kami!</p>
      <p>Bagikan pengalaman Anda untuk membantu wisatawan lain menemukan liburan impian mereka.</p>
      <a href="${data.reviewUrl}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">✍️ Tulis Review (2 Menit)</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Link ini hanya bisa digunakan sekali dan berlaku 7 hari.</p>
    </div>
  `;
}
