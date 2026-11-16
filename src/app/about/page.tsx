import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AboutClient, { type AboutData } from '@/components/pages/AboutClient';

export const revalidate = 300;

const FALLBACK: AboutData = {
  label: 'Tentang',
  heading: 'Tentang Kami',
  storyTitle: 'Cerita Kami',
  story: 'HAYBALI TRANS adalah mitra sewa mobil dengan supir tepercaya di Bali yang berkomitmen memberikan pengalaman perjalanan yang nyaman, aman, dan berkelas melalui pelayanan VIP, harga transparan, serta armada yang prima.\n\nKami menyediakan beragam pilihan armada — dari MPV keluarga hingga luxury MPV — lengkap dengan supir berpengalaman yang siap mengantar Anda ke seluruh penjuru Bali. Semua tarif sudah termasuk supir dan BBM tanpa batasan jarak tempuh.\n\nKami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merawat setiap unit dan melatih setiap pengemudi dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.',
  vision: 'Menjadi penyedia jasa sewa mobil dengan supir paling tepercaya di Bali dengan pelayanan VIP yang konsisten.',
  mission: [
    'Menyediakan armada bersih, wangi, dan terawat',
    'Memberikan pelayanan supir profesional dan ramah',
    'Harga transparan tanpa biaya tersembunyi',
    'Mempermudah proses booking dengan teknologi modern',
    'Mendukung pariwisata dan komunitas lokal Bali',
  ],
  whyUs: [
    { icon: '🚙', title: 'Armada Prima', desc: 'Kendaraan bersih, wangi, dan terawat untuk kenyamanan Anda.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '👨‍✈️', title: 'Supir Profesional', desc: 'Berpengalaman, ramah, dan siap melayani sesuai jam layanan kami.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-gold-400/10 text-gold-200' },
    { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-gold-400/10 text-gold-300' },
    { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung ekowisata dan masyarakat lokal Bali.', color: 'bg-gold-400/10 text-gold-200' },
  ],
};

async function getAboutData(): Promise<AboutData> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'about' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        label: parsed.label || FALLBACK.label,
        heading: parsed.heading || FALLBACK.heading,
        storyTitle: parsed.storyTitle || FALLBACK.storyTitle,
        story: parsed.story || FALLBACK.story,
        vision: parsed.vision || FALLBACK.vision,
        mission: Array.isArray(parsed.mission) ? parsed.mission : FALLBACK.mission,
        whyUs: Array.isArray(parsed.whyUs) ? parsed.whyUs : FALLBACK.whyUs,
      };
    }
  } catch { /* fallback */ }
  return FALLBACK;
}

interface AboutMeta {
  title: string;
  description: string;
}

async function getAboutMeta(): Promise<AboutMeta> {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'about' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      return {
        title: parsed.heading || 'Tentang Kami',
        description: parsed.story?.slice(0, 160) || 'Tentang Kami',
      };
    }
  } catch { /* fallback */ }
  return { title: 'Tentang Kami', description: 'Tentang Kami' };
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getAboutMeta();
  return { title: meta.title, description: meta.description };
}

export default async function AboutPage() {
  const data = await getAboutData();
  return <AboutClient data={data} />;
}
