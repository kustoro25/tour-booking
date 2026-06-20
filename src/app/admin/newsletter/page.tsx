'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import Pagination from '@/components/ui/Pagination';

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  const { showToast } = useToast();

  useEffect(() => { fetchSubscribers(); }, [page, search]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/newsletter?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data || []);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (sub: Subscriber) => {
    if (!confirm(`Hapus subscriber "${sub.email}"?`)) return;
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Subscriber berhasil dihapus', 'success');
        fetchSubscribers();
      } else {
        showToast(data.error || 'Gagal menghapus', 'error');
      }
    } catch {
      showToast('Gagal menghapus subscriber', 'error');
    }
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim()) { showToast('Subject wajib diisi', 'error'); return; }
    if (!body.trim()) { showToast('Konten wajib diisi', 'error'); return; }
    if (!confirm(`Kirim newsletter ke ${total} subscriber?`)) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), html: body }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(data.data);
        showToast(data.message, 'success');
        setSubject('');
        setBody('');
      } else {
        showToast(data.error || 'Gagal mengirim', 'error');
      }
    } catch {
      showToast('Gagal mengirim newsletter', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} subscriber · Kelola daftar email & kirim newsletter
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          {showCompose ? '✕ Tutup' : '✉️ Kirim Newsletter'}
        </button>
      </div>

      {/* ── Compose Newsletter ── */}
      {showCompose && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-orange-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">✉️</span>
            Buat Newsletter
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Newsletter akan dikirim ke <strong>{total} subscriber</strong> dengan template brand premium.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Promo Spesial Bulan Ini 🎉"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konten HTML *</label>
              <p className="text-xs text-gray-400 mb-2">
                Gunakan HTML: <code>&lt;h2&gt;</code> judul, <code>&lt;p&gt;</code> paragraf, <code>&lt;a&gt;</code> link.
              </p>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder={`<h2 style="color: #e59800;">Promo Spesial!</h2>\n<p>Halo pelanggan setia...</p>\n<a href="https://..." style="background: #e59800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Lihat Promo</a>`}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendNewsletter}
                disabled={sending}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {sending ? 'Mengirim...' : `Kirim ke ${total} Subscriber`}
              </button>
              <button
                onClick={() => { setShowCompose(false); setSendResult(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Batal
              </button>
            </div>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div className={`mt-4 p-4 rounded-xl ${sendResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className="text-sm font-semibold text-gray-900">
                ✅ Terkirim: {sendResult.sent} · ❌ Gagal: {sendResult.failed} · Total: {sendResult.total}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari email subscriber..."
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* ── Subscriber List ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {search ? 'Tidak ada subscriber yang cocok' : 'Belum ada subscriber'}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Bergabung</th>
                  <th className="px-4 py-3 text-center font-medium w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.email}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(sub.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(sub)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
