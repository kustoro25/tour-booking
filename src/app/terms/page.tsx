import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Syarat & Ketentuan' };

async function getTermsContent() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'terms' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      if (parsed.html) return parsed.html;
      if (typeof parsed === 'string') return parsed;
    }
  } catch { /* fallback */ }
  return null;
}

export default async function TermsPage() {
  const content = await getTermsContent();
  if (content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Syarat & Ketentuan</h1>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }
  const defaultHtml = `<h2>1. Umum</h2><p>Dengan menggunakan layanan Kami, Anda menyetujui seluruh syarat dan ketentuan.</p><h2>2. Pemesanan</h2><p>Booking sah setelah menerima nomor invoice. Data diri wajib diisi lengkap.</p><h2>3. Pembayaran</h2><p>Pembayaran dalam 24 jam sejak invoice. Jika tidak, pesanan otomatis dibatalkan.</p><h2>4. Pembatalan & Refund</h2><table><tr><th>Waktu</th><th>Refund</th></tr><tr><td>H-14+</td><td>80%</td></tr><tr><td>H-7~13</td><td>50%</td></tr><tr><td>H-3~6</td><td>25%</td></tr><tr><td>&lt;H-3</td><td>0%</td></tr></table><p>Refund diproses 7-14 hari kerja.</p><h2>5. Hubungi Kami</h2><p>Email: support@jelajahnusantara.com</p>`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Syarat & Ketentuan</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </div>
  );
}
