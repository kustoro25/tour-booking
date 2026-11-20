// Email service - uses nodemailer for SMTP delivery
// Falls back to console logging in development when no SMTP config is set

import nodemailer from 'nodemailer';
import { getCompanyName } from './settings';

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
  // Nama pengirim mengikuti brand aktif (setting admin company_name) — bukan env lama.
  const companyName = await getCompanyName();

  // If SMTP credentials are configured, send real email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await smtpTransport.sendMail({
        from: `"${companyName}" <${from}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      console.log(`✅ Email sent to ${payload.to} — "${payload.subject}"`);
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

// ============ HELPER BAHASA EMAIL ============
// Email ke pembeli mengikuti bahasa saat mereka memesan (id default).
export type EmailLang = 'id' | 'en';

/** Pilih teks sesuai bahasa email: 'id' default, 'en' saat diminta. */
function tr(lang: EmailLang | undefined, idText: string, enText: string): string {
  return lang === 'en' ? enText : idText;
}

export function invoiceEmailTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  tourDate: string;
  total: string;
  expiryDate: string;
  invoiceUrl: string;
  whatsappLink: string;
  notes?: string | null;
  companyName: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  const notesRow = data.notes
    ? `<tr><td style="padding-top: 12px;"><strong>${tr(lang, 'Catatan Khusus', 'Special Notes')}</strong></td><td style="padding-top: 12px;">${data.notes}</td></tr>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">${tr(lang, 'Booking Berhasil!', 'Booking Successful!')}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
      <p>${tr(lang, `Terima kasih telah memilih <strong>${data.companyName}</strong>. Berikut adalah detail pesanan Anda:`, `Thank you for choosing <strong>${data.companyName}</strong>. Here are your booking details:`)}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>Invoice</strong></td><td>${data.invoiceNo}</td></tr>
        <tr><td><strong>${tr(lang, 'Paket', 'Package')}</strong></td><td>${data.tourName}</td></tr>
        <tr><td><strong>${tr(lang, 'Tanggal', 'Date')}</strong></td><td>${data.tourDate}</td></tr>
        <tr><td><strong>Total</strong></td><td style="font-size: 18px; font-weight: bold;">${data.total}</td></tr>
        <tr><td><strong>${tr(lang, 'Batas Pembayaran', 'Payment Deadline')}</strong></td><td style="color: #F97316;">${data.expiryDate}</td></tr>
        ${notesRow}
      </table>
      <br/>
      <a href="${data.invoiceUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">💳 ${tr(lang, 'Lihat Invoice & Panduan Transfer', 'View Invoice & Payment Instructions')}</a>
      <br/>
      <a href="${data.whatsappLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px;">📱 ${tr(lang, 'Konfirmasi Transfer via WhatsApp', 'Confirm Transfer via WhatsApp')}</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">${tr(lang, 'Mohon lakukan transfer ke rekening yang tertera pada invoice, lalu kirim bukti transfer ke admin via WhatsApp/email sebelum batas waktu agar pesanan tidak otomatis dibatalkan.', 'Please transfer to the bank account shown on the invoice, then send your proof of transfer to our admin via WhatsApp/email before the deadline so your booking is not automatically cancelled.')}</p>
    </div>
  `;
}

export function paymentConfirmationTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  tourDate: string;
  companyName: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">${tr(lang, 'Pembayaran Dikonfirmasi!', 'Payment Confirmed!')}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
      <p>${tr(lang, `Pembayaran Anda untuk pesanan <strong>${data.invoiceNo}</strong> telah kami terima.`, `We have received your payment for booking <strong>${data.invoiceNo}</strong>.`)}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>${tr(lang, 'Paket', 'Package')}</strong></td><td>${data.tourName}</td></tr>
        <tr><td><strong>${tr(lang, 'Tanggal Tour', 'Tour Date')}</strong></td><td>${data.tourDate}</td></tr>
      </table>
      <br/>
      <p>${tr(lang, 'E-Ticket dan informasi selengkapnya akan dikirimkan segera.', 'Your E-Ticket and further details will be sent shortly.')}</p>
      <p>${tr(lang, 'Sampai jumpa di hari keberangkatan!', 'See you on departure day!')}</p>
      <p>${tr(lang, 'Salam,', 'Best regards,')}<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}

export function eTicketTemplate(data: {
  customerName: string;
  invoiceNo: string;
  tourName: string;
  tourDate: string;
  duration: string;
  destination: string;
  adults: number;
  children: number;
  total: string;
  itinerary: { day: number; title: string; description: string }[];
  includes: string[];
  excludes: string[];
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  invoiceUrl: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  const paxLabel = data.children > 0
    ? tr(lang, `${data.adults} dewasa + ${data.children} anak`, `${data.adults} adults + ${data.children} children`)
    : tr(lang, `${data.adults} dewasa`, `${data.adults} adults`);

  const itineraryHtml = data.itinerary.length > 0
    ? `
      <h3 style="margin: 24px 0 12px; font-size: 15px; color: #111827;">${tr(lang, 'Rencana Perjalanan', 'Itinerary')}</h3>
      ${data.itinerary.map((d) => `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="width: 64px; vertical-align: top; padding-top: 3px;">
              <span style="display: inline-block; background: #2563EB; color: #ffffff; border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: bold;">${tr(lang, 'Hari', 'Day')} ${d.day}</span>
            </td>
            <td>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${d.title}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #4B5563;">${d.description}</p>
            </td>
          </tr>
        </table>`).join('')}`
    : '';

  const includesHtml = data.includes.length > 0
    ? `
      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px 16px; margin-top: 16px;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #166534;">${tr(lang, 'Fasilitas Termasuk', 'Included')}</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #166534;">
          ${data.includes.map((item) => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const excludesHtml = data.excludes.length > 0
    ? `
      <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px 16px; margin-top: 12px;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #991B1B;">${tr(lang, 'Fasilitas Tidak Termasuk', 'Not Included')}</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #991B1B;">
          ${data.excludes.map((item) => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const contactLines = [
    data.companyPhone ? `${tr(lang, 'Telp/WA:', 'Phone/WA:')} ${data.companyPhone}` : '',
    data.companyEmail ? `${tr(lang, 'Email:', 'Email:')} <a href="mailto:${data.companyEmail}" style="color: #2563EB;">${data.companyEmail}</a>` : '',
    data.companyAddress ? `${tr(lang, 'Alamat:', 'Address:')} ${data.companyAddress}` : '',
  ].filter(Boolean).join(' &middot; ');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: #2563EB; border-radius: 8px 8px 0 0; padding: 22px 24px;">
        <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1px;">E-TICKET</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #DBEAFE;">${data.companyName} &mdash; ${tr(lang, 'tunjukkan e-ticket ini saat keberangkatan', 'present this e-ticket at departure')}</p>
      </div>
      <div style="background: #EFF6FF; border: 1px solid #DBEAFE; border-top: none; padding: 12px 24px;">
        <span style="font-size: 13px; color: #1E40AF;">${tr(lang, 'No. Invoice:', 'Invoice No.:')}&nbsp;</span>
        <strong style="font-size: 16px; color: #1E40AF; letter-spacing: 0.5px;">${data.invoiceNo}</strong>
      </div>
      <div style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <p style="margin: 0 0 12px;">${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
        <p style="margin: 0 0 16px;">${tr(lang, 'Pembayaran Anda telah kami terima. Berikut detail E-Ticket Anda:', 'We have received your payment. Here are your E-Ticket details:')}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Paket', 'Package')}</td><td style="padding: 6px 0; font-weight: bold;">${data.tourName}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Tanggal Tour', 'Tour Date')}</td><td style="padding: 6px 0; font-weight: bold; color: #2563EB;">${data.tourDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Durasi', 'Duration')}</td><td style="padding: 6px 0;">${data.duration}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Destinasi', 'Destination')}</td><td style="padding: 6px 0;">${data.destination}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Peserta', 'Passengers')}</td><td style="padding: 6px 0;">${paxLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B7280;">${tr(lang, 'Total Dibayar', 'Total Paid')}</td><td style="padding: 6px 0; font-weight: bold;">${data.total} <span style="color: #059669;">(${tr(lang, 'LUNAS', 'PAID IN FULL')})</span></td></tr>
        </table>
        ${itineraryHtml}
        ${includesHtml}
        ${excludesHtml}
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-top: 20px; font-size: 13px; color: #92400E;">
          ${tr(lang, 'Simpan email ini dan tunjukkan kepada admin/guide saat keberangkatan. Detail pesanan juga dapat dilihat di', 'Keep this email and show it to our admin/guide at departure. Booking details are also available on the')}
          <a href="${data.invoiceUrl}" style="color: #2563EB;">${tr(lang, 'halaman invoice', 'invoice page')}</a>.
        </div>
        ${contactLines ? `<p style="margin: 18px 0 0; font-size: 13px; color: #6B7280;">${tr(lang, 'Butuh bantuan? Hubungi kami:', 'Need help? Contact us:')} ${contactLines}</p>` : ''}
        <p style="margin: 20px 0 0;">${tr(lang, 'Sampai jumpa di hari keberangkatan!', 'See you on departure day!')}</p>
        <p style="margin: 12px 0 0;">${tr(lang, 'Salam,', 'Best regards,')}<br/><strong>${data.companyName}</strong></p>
      </div>
    </div>
  `;
}

export function adminOrderNotificationTemplate(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tourName: string;
  invoiceNo: string;
  tourDate: string;
  total: string;
  paymentType: string;
  adminUrl: string;
  notes?: string | null;
  companyName: string;
}): string {
  const notesRow = data.notes
    ? `<tr><td style="padding: 6px 0;"><strong>Catatan Khusus</strong></td><td style="background: #FEF9C3; padding: 8px; border-radius: 6px;">${data.notes}</td></tr>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Pesanan Baru Masuk</h2>
      <p>Ada pesanan baru di <strong>${data.companyName}</strong>. Berikut detail pembeli:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0;"><strong>Invoice</strong></td><td>${data.invoiceNo}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Nama</strong></td><td>${data.customerName}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email</strong></td><td><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
        <tr><td style="padding: 6px 0;"><strong>WhatsApp/HP</strong></td><td>${data.customerPhone}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Paket</strong></td><td>${data.tourName}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Tanggal Tour</strong></td><td>${data.tourDate}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Total</strong></td><td style="font-weight: bold;">${data.total}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Metode</strong></td><td>${data.paymentType}</td></tr>
        ${notesRow}
      </table>
      <a href="${data.adminUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Buka di Panel Admin</a>
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
  lang?: EmailLang;
}): string {
  const { lang } = data;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">${tr(lang, 'Terima Kasih telah Menghubungi Kami!', 'Thank You for Contacting Us!')}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.name}</strong>,</p>
      <p>${tr(lang, `Terima kasih telah menghubungi <strong>${data.companyName}</strong>. Pesan Anda telah kami terima dan tim kami akan segera menghubungi Anda.`, `Thank you for contacting <strong>${data.companyName}</strong>. We have received your message and our team will get back to you shortly.`)}</p>
      <p>${tr(lang, 'Waktu respons kami biasanya dalam <strong>1x24 jam</strong> pada hari kerja.', 'Our response time is usually within <strong>24 hours</strong> on business days.')}</p>
      <p>${tr(lang, 'Jika ada hal mendesak, silakan hubungi kami langsung:', 'For urgent matters, please contact us directly:')}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <tr><td style="padding: 4px 0;">📧 <strong>Email</strong></td><td><a href="mailto:${data.companyEmail}">${data.companyEmail}</a></td></tr>
        <tr><td style="padding: 4px 0;">📱 <strong>WhatsApp</strong></td><td>${data.companyPhone}</td></tr>
      </table>
      <p style="margin-top: 20px;">${tr(lang, 'Salam hangat,', 'Warm regards,')}<br/><strong>${tr(lang, `Tim ${data.companyName}`, `The ${data.companyName} Team`)}</strong></p>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">${tr(lang, 'Ini adalah email otomatis, mohon tidak membalas email ini.', 'This is an automated email, please do not reply.')}</p>
    </div>
  `;
}

export function reviewRequestTemplate(data: {
  customerName: string;
  tourName: string;
  reviewUrl: string;
  companyName: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F97316;">⭐ ${tr(lang, 'Bagaimana Pengalaman Perjalanan Anda?', 'How Was Your Travel Experience?')}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
      <p>${tr(lang, `Semoga Anda menikmati perjalanan <strong>${data.tourName}</strong> bersama kami!`, `We hope you enjoyed your <strong>${data.tourName}</strong> trip with us!`)}</p>
      <p>${tr(lang, 'Bagikan pengalaman Anda untuk membantu wisatawan lain menemukan liburan impian mereka.', 'Share your experience to help other travelers find their dream vacation.')}</p>
      <a href="${data.reviewUrl}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">✍️ ${tr(lang, 'Tulis Review (2 Menit)', 'Write a Review (2 Minutes)')}</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">${tr(lang, 'Link ini hanya bisa digunakan satu kali untuk pesanan Anda.', 'This link can only be used once for your booking.')}</p>
      <p style="margin-top: 20px;">${tr(lang, 'Salam hangat,', 'Warm regards,')}<br/><strong>${tr(lang, `Tim ${data.companyName}`, `The ${data.companyName} Team`)}</strong></p>
    </div>
  `;
}

// ============ INSTALLMENT EMAIL TEMPLATES ============

export function installmentAgreementTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  total: string;
  installmentCount: number;
  amountPerInstallment: string;
  downPayment: string;
  agreementUrl: string;
  companyName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Perjanjian Pembiayaan Angsuran</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Terima kasih telah memilih pembayaran secara angsuran untuk pemesanan tour <strong>${data.tourName}</strong>.</p>
      <p>Berikut adalah ringkasan Perjanjian Pembiayaan Anda:</p>
      <table style="width: 100%; border-collapse: collapse; background: #F9FAFB; border-radius: 8px; overflow: hidden;">
        <tr><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;"><strong>Invoice</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;">${data.invoiceNo}</td></tr>
        <tr><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;"><strong>Total</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;">${data.total}</td></tr>
        <tr><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;"><strong>Uang Muka (DP)</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;">${data.downPayment}</td></tr>
        <tr><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;"><strong>Jumlah Angsuran</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #E5E7EB;">${data.installmentCount}x @ ${data.amountPerInstallment}</td></tr>
      </table>
      <br/>
      <a href="${data.agreementUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">📄 Lihat Surat Perjanjian</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Mohon baca dan simpan surat perjanjian ini. Penagihan angsuran akan dikirim sesuai jadwal yang tertera.</p>
      <p style="margin-top: 10px;">Salam,<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}

export function installmentBillingTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  installmentNumber: number; // 0 = DP (uang muka)
  totalInstallments: number;
  amount: string;
  dueDate: string;
  paymentUrl: string;
  whatsappLink: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  notes?: string | null;
  companyName: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  const isDp = data.installmentNumber === 0;
  // Skema DP: totalInstallments = 1 berarti DP + pelunasan (tunai ke sopir / transfer)
  const isPelunasan = !isDp && data.totalInstallments === 1;
  const paymentLabel = isDp
    ? tr(lang, 'DP (Uang Muka)', 'DP (Down Payment)')
    : isPelunasan
      ? tr(lang, 'Pelunasan', 'Final Settlement')
      : tr(lang, `Angsuran ke-${data.installmentNumber}`, `Installment #${data.installmentNumber}`);
  const dueDateLabel = tr(lang, isDp ? 'Batas Pembayaran' : 'Jatuh Tempo', isDp ? 'Payment Deadline' : 'Due Date');

  const bankRows = data.bankAccounts
    .map(
      (b) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;"><strong>Bank ${b.bank}</strong></td><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;">${b.number}</td><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;">a.n. ${b.name}</td></tr>`
    )
    .join('');

  const paymentSection = `<h3 style="font-size: 14px; color: #374151;">${tr(lang, 'Informasi Rekening', 'Bank Account Information')}</h3>
      <table style="width: 100%; border-collapse: collapse; background: #F9FAFB; border-radius: 8px; overflow: hidden;">
        ${bankRows}
      </table>`;

  const notesSection = data.notes
    ? `<div style="background: #FEF9C3; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: bold; color: #92400E;">${tr(lang, 'Catatan Khusus Anda:', 'Your Special Notes:')}</p>
        <p style="margin: 0; font-size: 13px; color: #78350F;">${data.notes}</p>
      </div>`
    : '';

  const footerNote = tr(
    lang,
    `Mohon lakukan transfer sebelum jatuh tempo, lalu kirim bukti transfer ke admin via WhatsApp atau email. Status pembayaran diperbarui oleh admin setelah bukti diterima. Keterlambatan pembayaran dapat mengakibatkan pembatalan pesanan.`,
    `Please transfer before the due date, then send your proof of transfer to our admin via WhatsApp or email. The payment status is updated by our admin after the proof is received. Late payment may result in booking cancellation.`
  );

  const title = isDp
    ? tr(lang, 'Pembayaran DP (Uang Muka)', 'Down Payment (DP) Payment')
    : isPelunasan
      ? tr(lang, 'Pelunasan', 'Final Settlement')
      : tr(lang, `Penagihan Angsuran ke-${data.installmentNumber}`, `Installment #${data.installmentNumber} Billing`);

  const intro = isDp
    ? tr(
        lang,
        `Untuk mengaktifkan pesanan tour <strong>${data.tourName}</strong>, silakan lakukan pembayaran <strong>DP (Uang Muka)</strong>. Pelunasan dapat dibayar tunai kepada sopir saat bertemu di lokasi penjemputan, atau transfer bank.`,
        `To activate your <strong>${data.tourName}</strong> tour booking, please make the <strong>Down Payment (DP)</strong>. The remaining balance can be paid in cash to the driver at the pickup location, or via bank transfer.`
      )
    : isPelunasan
      ? tr(
          lang,
          `Berikut adalah penagihan <strong>pelunasan</strong> untuk pemesanan tour <strong>${data.tourName}</strong>. Pelunasan dapat dibayar tunai kepada sopir saat bertemu di lokasi penjemputan, atau transfer bank.`,
          `Here is the <strong>final settlement</strong> invoice for your <strong>${data.tourName}</strong> tour booking. The balance can be paid in cash to the driver at the pickup location, or via bank transfer.`
        )
      : tr(
          lang,
          `Berikut adalah penagihan angsuran ke-<strong>${data.installmentNumber}</strong> dari <strong>${data.totalInstallments}</strong> untuk pemesanan tour <strong>${data.tourName}</strong>.`,
          `Here is the billing for installment <strong>#${data.installmentNumber}</strong> of <strong>${data.totalInstallments}</strong> for your <strong>${data.tourName}</strong> tour booking.`
        );

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E59800;">${title}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
      <p>${intro}</p>
      
      <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>Invoice</strong></td><td style="padding: 6px 0;">${data.invoiceNo}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>${tr(lang, 'Pembayaran', 'Payment')}</strong></td><td style="padding: 6px 0;">${paymentLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>${tr(lang, 'Jumlah', 'Amount')}</strong></td><td style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #EA580C;">${data.amount}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>${dueDateLabel}</strong></td><td style="padding: 6px 0; font-weight: bold; color: #DC2626;">${data.dueDate}</td></tr>
        </table>
      </div>

      ${paymentSection}
      ${notesSection}

      <br/>
      <a href="${data.whatsappLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">📱 ${tr(lang, 'Kirim Bukti Transfer via WhatsApp', 'Send Proof of Transfer via WhatsApp')}</a>
      <br/>
      <a href="${data.paymentUrl}" style="background: #E59800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px;">💳 ${tr(lang, 'Lihat Jadwal Pembayaran', 'View Payment Schedule')}</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">${footerNote}</p>
      <p>${tr(lang, 'Salam,', 'Best regards,')}<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}

export function installmentConfirmationTemplate(data: {
  customerName: string;
  tourName: string;
  invoiceNo: string;
  installmentNumber: number;
  amount: string;
  remainingInstallments: number;
  nextDueDate: string;
  companyName: string;
  lang?: EmailLang;
}): string {
  const { lang } = data;
  const isDp = data.installmentNumber === 0;

  const nextBillingNote =
    data.remainingInstallments > 0
      ? `<div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1E40AF;"><strong>${tr(lang, `Sisa Angsuran: ${data.remainingInstallments}x`, `Remaining Installments: ${data.remainingInstallments}x`)}</strong></p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #3B82F6;">${tr(lang, 'Penagihan berikutnya akan dikirim menjelang jatuh tempo:', 'The next billing will be sent before the due date:')} <strong>${data.nextDueDate}</strong></p>
        </div>`
      : `<div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #065F46; font-size: 16px;"><strong>🎉 ${tr(lang, 'Seluruh angsuran telah LUNAS!', 'All installments have been PAID IN FULL!')}</strong></p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #059669;">${tr(lang, 'Terima kasih telah menyelesaikan seluruh pembayaran. E-Ticket akan segera dikirimkan.', 'Thank you for completing all payments. Your E-Ticket will be sent shortly.')}</p>
        </div>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">${isDp
        ? tr(lang, 'DP (Uang Muka) Diterima — Pesanan Aktif!', 'Down Payment (DP) Received — Booking Active!')
        : tr(lang, 'Pembayaran Angsuran Dikonfirmasi!', 'Installment Payment Confirmed!')}</h2>
      <p>${tr(lang, 'Halo', 'Hello')} <strong>${data.customerName}</strong>,</p>
      <p>${isDp
        ? tr(
            lang,
            `Uang muka (DP) sebesar <strong>${data.amount}</strong> untuk pemesanan <strong>${data.tourName}</strong> telah kami terima. Pesanan Anda kini <strong>AKTIF</strong> dan slot keberangkatan telah dikunci.`,
            `We have received your down payment (DP) of <strong>${data.amount}</strong> for the <strong>${data.tourName}</strong> booking. Your booking is now <strong>ACTIVE</strong> and the departure slot has been locked in.`
          )
        : tr(
            lang,
            `Pembayaran angsuran ke-<strong>${data.installmentNumber}</strong> sebesar <strong>${data.amount}</strong> untuk pemesanan <strong>${data.tourName}</strong> telah kami terima dan konfirmasi.`,
            `We have received and confirmed your installment <strong>#${data.installmentNumber}</strong> payment of <strong>${data.amount}</strong> for the <strong>${data.tourName}</strong> booking.`
          )}</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6B7280;">Invoice</td><td><strong>${data.invoiceNo}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">${tr(lang, 'Pembayaran', 'Payment')}</td><td><strong>${isDp ? tr(lang, 'DP (Uang Muka)', 'DP (Down Payment)') : tr(lang, `Angsuran ke-${data.installmentNumber}`, `Installment #${data.installmentNumber}`)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">${tr(lang, 'Jumlah Dibayar', 'Amount Paid')}</td><td style="font-weight: bold; color: #059669;">${data.amount}</td></tr>
      </table>

      ${nextBillingNote}

      <p>${tr(lang, 'Salam,', 'Best regards,')}<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}
