import Link from 'next/link';

export default function AdminPaymentsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">💰 Metode Pembayaran</h1>
      <p className="text-sm text-gray-500 mb-6">
        Metode pembayaran yang berlaku untuk semua pesanan (full payment maupun DP/angsuran).
      </p>

      {/* Mode aktif: Transfer Manual */}
      <div className="relative rounded-xl border-2 border-blue-500 ring-2 ring-blue-200 shadow-md p-5 bg-white">
        <span className="absolute -top-3 right-4 text-xs font-semibold text-white px-3 py-1 rounded-full bg-blue-600">
          ✓ AKTIF
        </span>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏦</span>
          <h2 className="text-lg font-semibold text-gray-900">Transfer Manual</h2>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Customer transfer ke rekening bank, lalu mengunggah bukti transfer. Status pembayaran
          diaktifkan manual oleh admin setelah bukti diverifikasi.
        </p>

        <ul className="space-y-1.5">
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>
              Customer mengunggah bukti transfer — admin otomatis mendapat notifikasi email baru
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>
              Admin mengecek bukti transfer lalu klik <strong>Konfirmasi</strong> di detail
              booking/angsuran — barulah status di website berubah menjadi terkonfirmasi
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>Sebelum dikonfirmasi admin, status hanya tampil &quot;Menunggu Konfirmasi&quot;</span>
          </li>
          <li className="flex items-start gap-2 text-xs text-gray-500">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>
              Rekening tujuan diatur di{' '}
              <Link href="/admin/settings" className="text-blue-600 hover:underline font-medium">
                Pengaturan → Rekening Bank
              </Link>
            </span>
          </li>
        </ul>
      </div>

      {/* Catatan tambahan */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Catatan:</strong> pembayaran online (otomatis via gateway) sudah tidak
          digunakan. Pesanan yang belum dibayar tetap otomatis dibatalkan sistem
          setelah 24 jam. Konfirmasi pembayaran dilakukan di halaman detail masing-masing pesanan:
          <code> Booking → Detail → Konfirmasi Pembayaran</code>, atau{' '}
          <code>Booking Cicilan → Detail → Konfirmasi</code> untuk DP/angsuran.
        </p>
      </div>
    </div>
  );
}
