import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
        Kebijakan Privasi
      </h1>
      <p className="text-gray-500 text-center mb-10">
        Terakhir diperbarui: 1 Januari 2026
      </p>

      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Saat Anda menggunakan layanan Jelajah Nusantara Tour, kami dapat mengumpulkan informasi berikut:
          </p>
          <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
            <li><strong>Data Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, dan informasi kontak lainnya yang Anda berikan saat booking.</li>
            <li><strong>Data Pemesanan:</strong> Detail paket tour yang dipesan, tanggal perjalanan, jumlah peserta, dan preferensi khusus.</li>
            <li><strong>Data Pembayaran:</strong> Informasi pembayaran diproses melalui payment gateway pihak ketiga. Kami tidak menyimpan data kartu kredit atau kredensial perbankan Anda.</li>
            <li><strong>Data Teknis:</strong> Alamat IP, tipe browser, sistem operasi, dan halaman yang dikunjungi untuk keperluan analitik.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Penggunaan Informasi</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Informasi yang kami kumpulkan digunakan untuk:
          </p>
          <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Memproses pemesanan dan pembayaran Anda.</li>
            <li>Mengirimkan invoice, e-ticket, dan konfirmasi pemesanan.</li>
            <li>Memberikan informasi tentang perubahan jadwal atau pembaruan tour.</li>
            <li>Mengirimkan permintaan review setelah tour selesai.</li>
            <li>Meningkatkan kualitas layanan dan pengalaman pengguna website.</li>
            <li>Mengirimkan informasi promosi dan penawaran khusus (dengan persetujuan Anda).</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Perlindungan Data</h2>
          <p className="text-gray-600 leading-relaxed">
            Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang memadai untuk
            melindungi data pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau
            penghancuran. Ini termasuk enkripsi data, firewall, dan kontrol akses yang ketat.
            Namun, perlu diketahui bahwa tidak ada metode transmisi data melalui internet yang 100%
            aman.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Berbagi Data dengan Pihak Ketiga</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Kami tidak menjual, memperdagangkan, atau menyewakan data pribadi Anda kepada pihak
            ketiga. Kami dapat membagikan data Anda dalam kondisi berikut:
          </p>
          <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
            <li><strong>Payment Gateway:</strong> Data pembayaran diproses oleh Midtrans/Xendit sesuai kebijakan privasi mereka.</li>
            <li><strong>Partner Tour:</strong> Data peserta (nama) dibagikan kepada guide dan operator tour untuk keperluan operasional.</li>
            <li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum atau perintah pengadilan yang sah.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookie</h2>
          <p className="text-gray-600 leading-relaxed">
            Website kami menggunakan cookie untuk meningkatkan pengalaman browsing Anda. Cookie
            adalah file kecil yang disimpan di perangkat Anda. Kami menggunakan cookie untuk:
            mengingat preferensi Anda, analisis trafik website, dan menjaga sesi login admin.
            Anda dapat menonaktifkan cookie melalui pengaturan browser, namun beberapa fitur
            website mungkin tidak berfungsi optimal.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Penyimpanan Data</h2>
          <p className="text-gray-600 leading-relaxed">
            Kami menyimpan data pribadi Anda selama diperlukan untuk tujuan pengumpulannya, atau
            sesuai dengan ketentuan hukum yang berlaku. Data pemesanan disimpan minimal 5 tahun
            untuk keperluan akuntansi dan pajak. Anda dapat meminta penghapusan data dengan
            menghubungi kami.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Hak Anda</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Anda memiliki hak-hak berikut terkait data pribadi Anda:
          </p>
          <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Hak untuk mengakses data pribadi Anda.</li>
            <li>Hak untuk mengoreksi data yang tidak akurat.</li>
            <li>Hak untuk meminta penghapusan data (right to be forgotten).</li>
            <li>Hak untuk menarik persetujuan pemrosesan data kapan saja.</li>
            <li>Hak untuk mengajukan keluhan ke otoritas perlindungan data.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Perubahan Kebijakan Privasi</h2>
          <p className="text-gray-600 leading-relaxed">
            Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan akan diumumkan
            melalui website dan, untuk perubahan signifikan, kami akan mengirimkan pemberitahuan
            melalui email. Penggunaan layanan setelah perubahan berarti Anda menyetujui kebijakan
            yang telah diperbarui.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Hubungi Kami</h2>
          <p className="text-gray-600 leading-relaxed">
            Jika Anda memiliki pertanyaan atau permintaan terkait Kebijakan Privasi ini, silakan
            hubungi kami melalui halaman{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Hubungi Kami
            </a>{' '}
            atau kirim email ke privacy@jelajahnusantara.com.
          </p>
        </section>
      </div>
    </div>
  );
}
