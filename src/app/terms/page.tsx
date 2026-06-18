import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
};

async function getTermsContent() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'terms' } });
    if (page?.content) {
      const parsed = JSON.parse(page.content);
      if (parsed.html) return parsed.html;
      if (typeof parsed === 'string') return parsed;
    }
  } catch { /* use default */ }
  return null;
}

export default async function TermsPage() {
  const content = await getTermsContent();

  if (content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
          Syarat & Ketentuan
        </h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
        Syarat & Ketentuan
      </h1>
      <p className="text-gray-500 text-center mb-10">
        Kelola konten halaman ini melalui{' '}
        <a href="/admin/pages" className="text-blue-600 hover:underline">Admin Panel → Pages → Terms & Conditions</a>
      </p>
    </div>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
        Syarat & Ketentuan
      </h1>
      <p className="text-gray-500 text-center mb-10">
        Terakhir diperbarui: 1 Januari 2026
      </p>

      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Umum</h2>
          <p className="text-gray-600 leading-relaxed">
            Dengan menggunakan layanan Jelajah Nusantara Tour (&quot;Kami&quot;), Anda (&quot;Tamu&quot; atau
            &quot;Pelanggan&quot;) dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan
            ketentuan yang berlaku. Jika Anda tidak menyetujui salah satu ketentuan, mohon tidak
            melanjutkan proses pemesanan.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Pemesanan (Booking)</h2>
          <ul className="space-y-3 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Booking dianggap sah apabila tamu telah menyelesaikan form pemesanan dan menerima nomor invoice.</li>
            <li>Tamu wajib mengisi data diri dengan lengkap dan benar. Segala kesalahan akibat data yang tidak valid menjadi tanggung jawab tamu.</li>
            <li>Setiap booking bersifat mengikat dan tidak dapat dipindahtangankan kepada pihak lain tanpa persetujuan tertulis dari Kami.</li>
            <li>Ketersediaan slot bersifat real-time. Sistem akan menolak booking jika slot untuk tanggal yang dipilih sudah penuh.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Pembayaran</h2>
          <ul className="space-y-3 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Pembayaran harus dilakukan dalam waktu 24 jam sejak invoice diterbitkan.</li>
            <li>Pembayaran dapat dilakukan melalui transfer bank atau e-wallet yang tercantum di invoice.</li>
            <li>Jika pembayaran tidak diterima dalam batas waktu, pesanan akan otomatis dibatalkan (status CANCELLED) dan slot dilepas kembali.</li>
            <li>Konfirmasi pembayaran akan diproses maksimal 1×24 jam setelah bukti pembayaran diterima.</li>
            <li>Semua harga yang tercantum sudah termasuk pajak dan biaya layanan, kecuali disebutkan lain.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Pembatalan & Refund</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Waktu Pembatalan</th>
                  <th className="text-left py-2 pr-4 font-semibold">Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2 pr-4">H-14 atau lebih sebelum keberangkatan</td><td className="py-2">80% dari total pembayaran</td></tr>
                <tr className="border-b"><td className="py-2 pr-4">H-7 sampai H-13 sebelum keberangkatan</td><td className="py-2">50% dari total pembayaran</td></tr>
                <tr className="border-b"><td className="py-2 pr-4">H-3 sampai H-6 sebelum keberangkatan</td><td className="py-2">25% dari total pembayaran</td></tr>
                <tr><td className="py-2 pr-4">Kurang dari H-3 sebelum keberangkatan</td><td className="py-2">Tidak ada refund</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            * Refund akan diproses dalam 7-14 hari kerja ke rekening yang didaftarkan tamu.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Perubahan Jadwal</h2>
          <ul className="space-y-3 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Permintaan perubahan tanggal keberangkatan dapat diajukan maksimal H-7 sebelum keberangkatan.</li>
            <li>Perubahan tanggal bergantung pada ketersediaan slot di tanggal yang baru.</li>
            <li>Biaya tambahan mungkin dikenakan jika harga di tanggal baru berbeda.</li>
            <li>Perubahan jumlah peserta dapat dilakukan maksimal H-3 sebelum keberangkatan dengan konfirmasi ketersediaan.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Tanggung Jawab</h2>
          <ul className="space-y-3 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Kami bertanggung jawab atas pelaksanaan tour sesuai dengan itinerary yang telah disepakati.</li>
            <li>Kami tidak bertanggung jawab atas kejadian di luar kendali (force majeure) seperti bencana alam, cuaca ekstrem, kerusuhan, atau kebijakan pemerintah yang mempengaruhi perjalanan.</li>
            <li>Tamu bertanggung jawab atas barang bawaan pribadi selama tour berlangsung.</li>
            <li>Kami sangat menyarankan tamu untuk memiliki asuransi perjalanan pribadi.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Kode Etik Tamu</h2>
          <ul className="space-y-3 text-gray-600 leading-relaxed list-disc pl-5">
            <li>Tamu wajib menghormati budaya, adat istiadat, dan norma setempat selama tour berlangsung.</li>
            <li>Tamu dilarang melakukan tindakan yang melanggar hukum atau membahayakan diri sendiri dan orang lain.</li>
            <li>Kami berhak mengeluarkan tamu dari tour tanpa refund jika tamu melanggar kode etik yang berlaku.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Perubahan Ketentuan</h2>
          <p className="text-gray-600 leading-relaxed">
            Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan
            melalui website dan berlaku efektif sejak tanggal publikasi. Penggunaan layanan setelah
            perubahan berarti Anda menyetujui ketentuan yang telah diperbarui.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Hubungi Kami</h2>
          <p className="text-gray-600 leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami
            melalui halaman{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Hubungi Kami
            </a>{' '}
            atau kirim email ke support@jelajahnusantara.com.
          </p>
        </section>
      </div>
    </div>
  );
}
