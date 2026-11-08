import type { Metadata } from 'next';
import { getPaymentGateway, type PaymentGatewayMode } from '@/lib/settings';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAQ',
};

/** Jawaban metode pembayaran menyesuaikan mode aktif: transfer manual atau gateway online. */
function paymentAnswerFor(mode: PaymentGatewayMode): string {
  if (mode === 'midtrans') {
    return 'Pembayaran diproses otomatis melalui gateway pembayaran online — tersedia QRIS, Virtual Account berbagai bank, e-wallet (GoPay, ShopeePay, DANA, dan lainnya), serta kartu kredit/debit. Setelah pembayaran berhasil, pesanan Anda langsung terkonfirmasi otomatis. Untuk pembayaran angsuran (cicilan), tagihan dikirim melalui email dan dapat dibayar langsung dari halaman jadwal angsuran. Detail lengkap tercantum di invoice Anda.';
  }
  return 'Pembayaran dilakukan dengan transfer bank ke rekening perusahaan yang tercantum di invoice. Setelah transfer, kirim bukti pembayaran melalui WhatsApp atau email agar admin dapat memverifikasi. Status pesanan diperbarui oleh admin setelah pembayaran diterima. Untuk pembayaran angsuran (cicilan), bukti transfer diunggah pada halaman jadwal angsuran. Detail lengkap tercantum di invoice Anda.';
}

const buildFaqs = (paymentAnswer: string) => [
  {
    question: 'Bagaimana cara melakukan booking sewa mobil?',
    answer:
      'Pilih armada yang Anda inginkan di halaman Sewa Mobil, tentukan tanggal serta durasi sewa (6 atau 12 jam) dari kalender, isi data diri dan jam penjemputan, lalu klik "Pesan Mobil Ini". Invoice akan langsung terbit dan dikirim ke email Anda.',
  },
  {
    question: 'Apakah saya bisa mengganti tanggal atau jam penjemputan?',
    answer:
      'Bisa. Silakan hubungi tim kami melalui WhatsApp atau email untuk mengajukan perubahan. Perubahan mengikuti ketersediaan armada dan sebaiknya dikonfirmasi minimal 3 jam sebelum jadwal penjemputan.',
  },
  {
    question: 'Bagaimana metode pembayaran yang tersedia?',
    answer: paymentAnswer,
  },
  {
    question: 'Berapa lama batas waktu pembayaran?',
    answer:
      'Batas waktu pembayaran adalah 24 jam sejak invoice diterbitkan. Jika pembayaran tidak dilakukan dalam batas waktu tersebut, pesanan akan otomatis dibatalkan oleh sistem dan jadwal armada dilepas kembali. Anda akan menerima email pengingat sebelum batas waktu berakhir.',
  },
  {
    question: 'Apakah saya akan menerima e-ticket?',
    answer:
      'Ya, setelah pembayaran Anda terkonfirmasi, sistem akan mengirimkan E-Ticket ke email Anda. E-Ticket berisi detail lengkap pemesanan: jenis armada, tanggal, jam penjemputan, area tujuan, dan kontak pengemudi.',
  },
  {
    question: 'Apakah harga sewa sudah termasuk supir dan BBM?',
    answer:
      'Ya. Semua harga sewa mobil HAYBALI TRANS sudah termasuk supir berpengalaman dan BBM tanpa batasan jarak tempuh. Tiket masuk objek wisata, biaya parkir, dan biaya tol tidak termasuk dan menjadi tanggungan tamu.',
  },
  {
    question: 'Apakah ada biaya tambahan untuk area tertentu?',
    answer:
      'Ada. Setiap armada memiliki area standar layanan, sedangkan area di luar standar dikenakan biaya tambahan sesuai tabel remote area yang tercantum di halaman Sewa Mobil dan halaman detail armada.',
  },
  {
    question: 'Bagaimana kebijakan jam kerja pengemudi?',
    answer:
      'Jam kerja pengemudi adalah 07.00–23.59 WITA. Penjemputan 07.00–10.30 tanpa biaya tambahan; di luar jam tersebut dikenakan Rp 50.000/mobil. Lewat tengah malam dikenakan Rp 150.000/jam, dan bila menginap di luar kota dikenakan Rp 350.000/malam.',
  },
  {
    question: 'Bagaimana kebijakan pembatalan?',
    answer:
      'Pembatalan sebaiknya dikonfirmasi minimal 3 jam sebelum jadwal penjemputan. Bila pembatalan dilakukan kurang dari waktu tersebut, mohon dimaklumi bahwa DP yang telah dibayarkan tidak dapat dikembalikan karena jadwal & pengemudi telah kami kunci untuk Anda.',
  },
  {
    question: 'Bagaimana cara memberikan review setelah sewa selesai?',
    answer:
      'Setelah perjalanan selesai, Anda akan menerima email berisi link khusus untuk menulis review dan memberikan rating. Link ini berlaku satu kali dan hanya untuk tamu yang telah menyelesaikan perjalanan. Review Anda sangat berarti bagi kami dan calon pelanggan lainnya!',
  },
];

export default async function FaqPage() {
  const faqs = buildFaqs(paymentAnswerFor(await getPaymentGateway()));
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-gold-300 text-sm font-semibold tracking-wide uppercase mb-2">Bantuan</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ivory mb-4">
          Pertanyaan yang Sering Diajukan
        </h1>
        <p className="text-mist-dim max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan-pertanyaan umum seputar pemesanan, pembayaran, dan
          sewa mobil bersama HAYBALI TRANS.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="bg-ink-850 rounded-xl shadow-card group overflow-hidden border border-ink-700 hover:border-gold-500/20 transition-colors"
          >
            <summary className="px-5 sm:px-6 py-4 cursor-pointer flex items-center justify-between gap-4 font-semibold text-ivory hover:text-gold-300 transition-colors text-sm sm:text-base [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 bg-gold-400/10 text-gold-300 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {faq.question}
              </span>
              <svg
                className="w-5 h-5 text-mist-dim group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
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
            <div className="px-5 sm:px-6 pb-5 text-mist leading-relaxed text-sm sm:text-base border-t border-ink-700 pt-4 ml-14 sm:ml-16">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
