import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Kebijakan Privasi' };

async function getPrivacyContent() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'privacy' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      if (parsed.html) return parsed.html;
      if (typeof parsed === 'string') return parsed;
    }
  } catch { /* fallback */ }
  return null;
}

export default async function PrivacyPage() {
  const content = await getPrivacyContent();
  if (content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Kebijakan Privasi</h1>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }
  const defaultHtml = `<h2>1. Informasi yang Kami Kumpulkan</h2><p>Saat Anda menggunakan layanan Jelajah Nusantara Tour, kami mengumpulkan: nama, email, telepon, data pemesanan, data pembayaran (diproses via payment gateway), dan data teknis (IP, browser).</p><h2>2. Penggunaan Informasi</h2><p>Untuk memproses pemesanan, mengirim invoice & e-ticket, update jadwal, dan meningkatkan layanan.</p><h2>3. Perlindungan Data</h2><p>Kami menerapkan enkripsi, firewall, dan kontrol akses ketat.</p><h2>4. Hubungi Kami</h2><p>Email: privacy@jelajahnusantara.com</p>`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Kebijakan Privasi</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </div>
  );
}
