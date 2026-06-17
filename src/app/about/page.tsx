import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang Kami',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Tentang</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Tentang Kami</h1>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5 sm:p-8 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">📖</span>
          <h2 className="text-xl font-semibold text-gray-900">Cerita Kami</h2>
        </div>
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong className="text-blue-700">Jelajah Nusantara Tour</strong> adalah perusahaan jasa perjalanan wisata yang berkomitmen memberikan pengalaman liburan tak terlupakan dengan pelayanan personal dan harga transparan.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Berdiri sejak 2018, kami telah melayani ribuan wisatawan domestik dan mancanegara dengan paket-paket tour pilihan ke destinasi terbaik di Indonesia. Dari Bali hingga Raja Ampat, dari Bromo hingga Danau Toba — kami ada untuk mewujudkan liburan impian Anda.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Kami percaya bahwa setiap perjalanan adalah cerita yang berharga. Itulah mengapa kami merancang setiap paket tour dengan detail dan penuh perhatian, memastikan setiap momen perjalanan Anda menjadi kenangan yang tak terlupakan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl shadow-card p-5 sm:p-8 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center text-lg shadow-sm">🎯</span>
            <h2 className="text-xl font-semibold text-gray-900">Visi</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Menjadi platform booking tour yang paling mudah, transparan, dan terpercaya bagi wisatawan domestik maupun mancanegara.
          </p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl shadow-card p-5 sm:p-8 border border-teal-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center text-lg shadow-sm">🚀</span>
            <h2 className="text-xl font-semibold text-gray-900">Misi</h2>
          </div>
          <ul className="space-y-2 text-gray-700">
            {[
              'Menyediakan paket tour berkualitas dengan harga transparan',
              'Memberikan pelayanan personal dan profesional',
              'Mempermudah proses booking dengan teknologi modern',
              'Mendukung pariwisata lokal dan komunitas setempat',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>
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
          {[
            { icon: '🎯', title: 'Guide Profesional', desc: 'Tim guide kami berpengalaman, bersertifikat, dan ramah.', color: 'bg-blue-50 text-blue-600' },
            { icon: '💰', title: 'Harga Transparan', desc: 'Tidak ada biaya tersembunyi. Semua jelas di awal.', color: 'bg-green-50 text-green-600' },
            { icon: '⚡', title: 'Booking Instan', desc: 'Sistem booking modern, invoice langsung terbit.', color: 'bg-purple-50 text-purple-600' },
            { icon: '🔄', title: 'Fleksibel', desc: 'Jadwal private trip yang bisa disesuaikan dengan kebutuhan Anda.', color: 'bg-teal-50 text-teal-600' },
            { icon: '🛡️', title: 'Terpercaya', desc: 'Ribuan tamu puas telah menggunakan layanan kami.', color: 'bg-orange-50 text-orange-600' },
            { icon: '🌿', title: 'Responsible Travel', desc: 'Kami mendukung ekowisata dan pemberdayaan masyarakat lokal.', color: 'bg-emerald-50 text-emerald-600' },
          ].map((item) => (
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
