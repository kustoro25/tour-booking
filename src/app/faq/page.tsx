import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
};

const faqs = [
  {
    question: 'Bagaimana cara melakukan booking?',
    answer:
      'Caranya sangat mudah! Cukup pilih paket tour yang Anda inginkan di halaman Paket Wisata, pilih tanggal keberangkatan dari kalender interaktif, isi data diri dan jumlah peserta, lalu klik "Booking Sekarang". Invoice akan langsung terbit dan dikirim ke email Anda.',
  },
  {
    question: 'Apakah saya bisa mengganti tanggal keberangkatan?',
    answer:
      'Ya, Anda bisa mengajukan perubahan tanggal keberangkatan maksimal H-7 sebelum keberangkatan. Silakan hubungi tim kami melalui WhatsApp atau email untuk proses perubahan. Perubahan tanggal bergantung pada ketersediaan slot di tanggal yang baru.',
  },
  {
    question: 'Bagaimana metode pembayaran yang tersedia?',
    answer:
      'Pembayaran diproses otomatis melalui gateway Midtrans — tersedia QRIS, Virtual Account berbagai bank, e-wallet (GoPay, ShopeePay, DANA, dan lainnya), serta kartu kredit/debit. Setelah pembayaran berhasil, pesanan Anda langsung terkonfirmasi otomatis. Untuk pembayaran angsuran (cicilan), transfer dilakukan ke rekening bank perusahaan dan bukti transfer dikirim melalui WhatsApp atau email. Detail lengkap tercantum di invoice Anda.',
  },
  {
    question: 'Berapa lama batas waktu pembayaran?',
    answer:
      'Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika pembayaran tidak dilakukan dalam batas waktu tersebut, pesanan akan otomatis dibatalkan oleh sistem dan slot akan dilepas kembali. Anda akan menerima email pengingat sebelum batas waktu berakhir.',
  },
  {
    question: 'Apakah saya akan menerima e-ticket?',
    answer:
      'Ya, setelah pembayaran Anda terkonfirmasi, sistem akan mengirimkan E-Ticket ke email Anda. E-Ticket berisi detail lengkap perjalanan Anda: nama paket, tanggal, itinerary, dan kontak guide yang akan mendampingi.',
  },
  {
    question: 'Apakah ada minimal peserta untuk setiap tour?',
    answer:
      'Ya, setiap paket tour memiliki minimal peserta yang berbeda-beda (umumnya 2 orang). Informasi ini tercantum di halaman detail masing-masing paket tour. Jika kuota minimal tidak terpenuhi, tim kami akan menghubungi Anda untuk opsi alternatif.',
  },
  {
    question: 'Bagaimana jika tour dibatalkan oleh pihak penyelenggara?',
    answer:
      'Jika tour terpaksa dibatalkan oleh kami karena force majeure atau kuota minimal tidak terpenuhi, Anda akan mendapatkan refund 100% dari jumlah yang telah dibayarkan. Tim kami akan menghubungi Anda untuk proses pengembalian dana.',
  },
  {
    question: 'Apakah bisa melakukan refund jika saya membatalkan?',
    answer:
      'Kebijakan refund kami: Pembatalan H-14 sebelum keberangkatan: refund 80%. Pembatalan H-7 sebelum keberangkatan: refund 50%. Pembatalan H-3 sebelum keberangkatan: refund 25%. Pembatalan kurang dari H-3: tidak ada refund. Silakan baca Syarat & Ketentuan untuk detail lengkap.',
  },
  {
    question: 'Apakah harga sudah termasuk tiket pesawat?',
    answer:
      'Umumnya harga paket tour tidak termasuk tiket pesawat, kecuali disebutkan secara eksplisit di deskripsi paket. Fasilitas yang termasuk dan tidak termasuk tercantum dengan jelas di halaman detail setiap paket tour.',
  },
  {
    question: 'Apakah anak-anak dikenakan biaya?',
    answer:
      'Ya, tersedia harga khusus untuk anak-anak (biasanya usia 3-10 tahun) yang lebih terjangkau. Detail harga dewasa dan anak tercantum di setiap halaman paket tour. Untuk anak di bawah 3 tahun umumnya gratis (tanpa fasilitas tambahan).',
  },
  {
    question: 'Bagaimana cara memberikan review setelah tour selesai?',
    answer:
      'Setelah tour selesai, Anda akan menerima email berisi link khusus untuk menulis review dan memberikan rating. Link ini berlaku satu kali dan hanya untuk tamu yang telah menyelesaikan tour. Review Anda sangat berarti bagi kami dan calon wisatawan lainnya!',
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">Bantuan</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Pertanyaan yang Sering Diajukan
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan-pertanyaan umum seputar pemesanan, pembayaran, dan
          perjalanan tour bersama HAYBALI TRANS.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="bg-white rounded-xl shadow-card group overflow-hidden border border-gray-100 hover:border-blue-100 transition-colors"
          >
            <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {faq.question}
              </span>
              <svg
                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-5 sm:px-6 pb-5 text-gray-600 leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-4 ml-14 sm:ml-16">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
