import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ContactForm from './ContactForm';

export const dynamic = 'force-dynamic';

export interface ContactData {
  label: string;
  heading: string;
  subheading: string;
  infoCards: { icon: string; title: string; detail: string; color: string }[];
}

const FALLBACK: ContactData = {
  label: 'Kontak',
  heading: 'Hubungi Kami',
  subheading: 'Punya pertanyaan atau butuh bantuan memilih paket? Tim kami siap membantu!',
  infoCards: [
    { icon: '📞', title: 'WhatsApp', detail: '+62 812-3456-7890', color: 'from-green-500 to-green-600' },
    { icon: '📧', title: 'Email', detail: 'info@jelajahnusantara.com', color: 'from-blue-500 to-blue-600' },
    { icon: '🕐', title: 'Jam Operasional', detail: 'Senin – Jumat, 09.00 – 18.00 WIB', color: 'from-purple-500 to-purple-600' },
    { icon: '📍', title: 'Alamat', detail: 'Jl. Pariwisata No. 123, Jakarta Selatan', color: 'from-orange-500 to-orange-600' },
  ],
};

async function getSettingsFallback(fallback: ContactData): Promise<ContactData> {
  try {
    const [phoneSetting, emailSetting, addrSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'company_phone' } }),
      prisma.setting.findUnique({ where: { key: 'company_email' } }),
      prisma.setting.findUnique({ where: { key: 'company_address' } }),
    ]);
    const cards = fallback.infoCards.map(card => {
      if (card.title === 'WhatsApp' && phoneSetting) {
        try { const v = JSON.parse(phoneSetting.value); if (typeof v === 'string' && v.trim()) return { ...card, detail: v.trim() }; } catch {}
      }
      if (card.title === 'Email' && emailSetting) {
        try { const v = JSON.parse(emailSetting.value); if (typeof v === 'string' && v.trim()) return { ...card, detail: v.trim() }; } catch {}
      }
      if (card.title === 'Alamat' && addrSetting) {
        try { const v = JSON.parse(addrSetting.value); if (typeof v === 'string' && v.trim()) return { ...card, detail: v.trim() }; } catch {}
      }
      return card;
    });
    return { ...fallback, infoCards: cards };
  } catch { return fallback; }
}

async function getContactData(): Promise<ContactData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'contact' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        label: parsed.label || FALLBACK.label,
        heading: parsed.heading || FALLBACK.heading,
        subheading: parsed.subheading || FALLBACK.subheading,
        infoCards: Array.isArray(parsed.infoCards) && parsed.infoCards.length > 0
          ? parsed.infoCards
          : (await getSettingsFallback(FALLBACK)).infoCards,
      };
    }
  } catch { /* fallback */ }
  return getSettingsFallback(FALLBACK);
}

async function getContactMeta(): Promise<{ title: string; description: string }> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'contact' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        title: parsed.heading || 'Hubungi Kami',
        description: parsed.subheading?.slice(0, 160) || 'Hubungi Kami',
      };
    }
  } catch { /* fallback */ }
  return { title: 'Hubungi Kami', description: 'Hubungi Kami' };
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getContactMeta();
  return { title: meta.title, description: meta.description };
}

export default async function ContactPage() {
  const data = await getContactData();
  return <ContactForm data={data} />;
}
