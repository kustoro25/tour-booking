import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface AboutData {
  label: string;
  heading: string;
  storyTitle: string;
  story: string;
  vision: string;
  mission: string[];
  whyUs: { icon: string; title: string; desc: string; color: string }[];
}

const FALLBACK: AboutData = {
  label: 'Tentang',
  heading: 'Tentang Kami',
  storyTitle: 'Cerita Kami',
  story: 'HAYBALI TRANS adalah mitra transportasi dan privat tur tepercaya di Bali yang berkomitmen memberikan pengalaman liburan tak terlupakan dengan pelayanan VIP, harga transparan, dan armada yang prima.\n\nKami melayani sewa mobil mewah dengan supir berpengalaman, paket tur privat ke destinasi terbaik Bali, serta antar-jemput bandara Ngurah Rai 24/7. Dari Kintamani hingga Uluwatu, dari Lovina hingga Nusa Penida — kami siap mengantar Anda menjelajahi setiap sudut Pulau Dewata.\n\nKami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merancang setiap layanan dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.',
  vision: 'Menjadi mitra transportasi dan privat tur paling tepercaya di Bali dengan pelayanan VIP yang konsisten.',
  mission: [
    'Menyediakan armada bersih, wangi, dan terawat',
    'Memberikan pelayanan supir profesional dan ramah',
    'Harga transparan tanpa biaya tersembunyi',
    'Mempermudah proses booking dengan teknologi modern',
    'Mendukung pariwisata dan komunitas lokal Bali',
  ],
  whyUs: [
    { icon: '🚙', title: 'Armada Prima', desc: 'Kendaraan bersih, wangi, dan terawat untuk kenyamanan Anda.', color: 'bg-amber-50 text-amber-600' },
    { icon: '👨‍✈️', title: 'Supir Profesional', desc: 'Berpengalaman, ramah, dan siap melayani 24/7.', color: 'bg-green-50 text-green-600' },
    { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-purple-50 text-purple-600' },
    { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-orange-50 text-orange-600' },
    { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-teal-50 text-teal-600' },
    { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung ekowisata dan masyarakat lokal Bali.', color: 'bg-emerald-50 text-emerald-600' },
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-amber-600 text-sm font-semibold tracking-wide uppercase mb-2">{data.label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{data.heading}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5 sm:p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg">📖</span>
          <h2 className="text-xl font-semibold text-gray-900">{data.storyTitle}</h2>
        </div>
        {data.story.split('\n\n').map((paragraph, i) => (
          <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
            {i === 0 ? (
              <>
                <strong className="text-amber-700">HAYBALI TRANS</strong>{' '}
                {paragraph.replace(/^HAYBALI TRANS adalah /, 'adalah ')}
              </>
            ) : (
              paragraph
            )}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl shadow-card p-5 sm:p-8 border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center text-lg shadow-sm">🎯</span>
            <h2 className="text-xl font-semibold text-gray-900">Visi</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{data.vision}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl shadow-card p-5 sm:p-8 border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg shadow-sm">🚀</span>
            <h2 className="text-xl font-semibold text-gray-900">Misi</h2>
          </div>
          <ul className="space-y-2 text-gray-700">
            {data.mission.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5 sm:p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">⭐</span>
          <h2 className="text-xl font-semibold text-gray-900">Mengapa Memilih Kami?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.whyUs.map((item) => (
            <div key={item.title} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-xl flex-shrink-0`}>
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
