import { formatCurrency } from '@/lib/utils';
import type { Metadata } from 'next';
import TransferQuickForm from './TransferQuickForm';
import {
  HAYBALI_BRAND,
  AIRPORT_TRANSFER_RATES,
  waLink,
} from '@/lib/haybali';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${HAYBALI_BRAND} - Antar-Jemput Bandara Ngurah Rai`,
  description:
    'Layanan penjemputan dan pengantaran bandara Ngurah Rai 24/7 tepat waktu. Daftar harga sesuai jumlah penumpang.',
};

export default function AntarJemputPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20">
          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-4 py-1.5 text-sm mb-4 tracking-wide">
            {HAYBALI_BRAND} • Antar-Jemput Bandara
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-2xl text-gray-900">
            Antar-Jemput Bandara <span className="text-amber-500">Ngurah Rai</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl leading-relaxed">
            Layanan penjemputan dan pengantaran 24/7 tepat waktu. Driver kami siap
            menyambut Anda langsung di area kedatangan bandara.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tabel tarif */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Daftar Harga Antar-Jemput Bandara</h2>
              <p className="text-sm text-gray-500">
                Harga per sekali antar / jemput Bandara Ngurah Rai, sesuai jumlah penumpang.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Area / Tujuan</th>
                    <th className="text-right px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">1 - 5 Orang</th>
                    <th className="text-right px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">6 - 10 Orang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {AIRPORT_TRANSFER_RATES.map((rate) => (
                    <tr key={rate.area} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-2.5 text-gray-800">{rate.area}</td>
                      <td className="px-4 sm:px-6 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(rate.priceSmall)}
                      </td>
                      <td className="px-4 sm:px-6 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                        {rate.priceBig !== null ? formatCurrency(rate.priceBig) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-xs text-gray-500 bg-gray-50">
              Harga dapat berubah sewaktu-waktu. Konfirmasi harga akhir via WhatsApp.{' '}
              <a href={waLink(`Halo ${HAYBALI_BRAND}, saya ingin bertanya harga antar jemput bandara.`)} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                Tanya Harga via WhatsApp
              </a>
            </div>
          </div>

          {/* Sidebar form */}
          <div className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              <TransferQuickForm />

              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 text-sm text-gray-600 space-y-3">
                <h3 className="font-bold text-gray-900 text-base">ℹ️ Informasi Layanan</h3>
                <p>• Penjemputan & pengantaran 24/7, tepat waktu.</p>
                <p>• Driver siap menyambut Anda langsung di area kedatangan bandara.</p>
                <p>• Mohon memberikan data yang konkret untuk mempermudah penjemputan.</p>
                <p>• Informasikan bila pesawat mengalami delay.</p>
                <p>• Pembatalan 3 jam sebelum pemberangkatan dikenakan biaya 50% dari tiket.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
