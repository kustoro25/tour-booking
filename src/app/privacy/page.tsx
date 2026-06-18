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
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Kebijakan Privasi</h1>
      <p className="text-gray-500 text-center mb-10">
        Kelola konten via <a href="/admin/pages" className="text-blue-600 hover:underline">Admin Panel → Pages</a>
      </p>
    </div>
  );
}
