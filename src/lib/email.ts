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
  installmentNumber: number;
  totalInstallments: number;
  amount: string;
  dueDate: string;
  paymentUrl: string;
  bankAccounts: { bank: string; number: string; name: string }[];
  companyName: string;
}): string {
  const bankRows = data.bankAccounts
    .map(
      (b) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;"><strong>Bank ${b.bank}</strong></td><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;">${b.number}</td><td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB;">a.n. ${b.name}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E59800;">Penagihan Angsuran ke-${data.installmentNumber}</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Berikut adalah penagihan angsuran ke-<strong>${data.installmentNumber}</strong> dari <strong>${data.totalInstallments}</strong> untuk pemesanan tour <strong>${data.tourName}</strong>.</p>
      
      <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>Invoice</strong></td><td style="padding: 6px 0;">${data.invoiceNo}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>Angsuran ke-</strong></td><td style="padding: 6px 0;">${data.installmentNumber} / ${data.totalInstallments}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>Jumlah</strong></td><td style="padding: 6px 0; font-size: 18px; font-weight: bold; color: #EA580C;">${data.amount}</td></tr>
          <tr><td style="padding: 6px 0; color: #92400E;"><strong>Jatuh Tempo</strong></td><td style="padding: 6px 0; font-weight: bold; color: #DC2626;">${data.dueDate}</td></tr>
        </table>
      </div>

      <h3 style="font-size: 14px; color: #374151;">Informasi Rekening</h3>
      <table style="width: 100%; border-collapse: collapse; background: #F9FAFB; border-radius: 8px; overflow: hidden;">
        ${bankRows}
      </table>

      <br/>
      <a href="${data.paymentUrl}" style="background: #E59800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">💳 Upload Bukti Transfer</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">Mohon lakukan pembayaran sebelum tanggal jatuh tempo dan upload bukti transfer melalui link di atas. Keterlambatan pembayaran dapat mengakibatkan pembatalan pesanan.</p>
      <p>Salam,<br/><strong>${data.companyName}</strong></p>
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
}): string {
  const nextBillingNote =
    data.remainingInstallments > 0
      ? `<div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1E40AF;"><strong>Sisa Angsuran: ${data.remainingInstallments}x</strong></p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #3B82F6;">Penagihan berikutnya akan dikirim menjelang jatuh tempo: <strong>${data.nextDueDate}</strong></p>
        </div>`
      : `<div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #065F46; font-size: 16px;"><strong>🎉 Seluruh angsuran telah LUNAS!</strong></p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #059669;">Terima kasih telah menyelesaikan seluruh pembayaran. E-Ticket akan segera dikirimkan.</p>
        </div>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Pembayaran Angsuran Dikonfirmasi!</h2>
      <p>Halo <strong>${data.customerName}</strong>,</p>
      <p>Pembayaran angsuran ke-<strong>${data.installmentNumber}</strong> sebesar <strong>${data.amount}</strong> untuk pemesanan <strong>${data.tourName}</strong> telah kami terima dan konfirmasi.</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6B7280;">Invoice</td><td><strong>${data.invoiceNo}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">Angsuran ke-</td><td><strong>${data.installmentNumber}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #6B7280;">Jumlah Dibayar</td><td style="font-weight: bold; color: #059669;">${data.amount}</td></tr>
      </table>

      ${nextBillingNote}

      <p>Salam,<br/><strong>${data.companyName}</strong></p>
    </div>
  `;
}
