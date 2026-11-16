import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import LegalClient from '@/components/pages/LegalClient';

export const revalidate = 300;

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
  return <LegalClient kind="privacy" cmsHtml={content} />;
}
