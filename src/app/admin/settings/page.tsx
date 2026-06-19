'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import ImageUpload from '@/components/ui/ImageUpload';
import { useAdminRole } from '@/lib/useAdminRole';

type InvoiceTheme = 'classic' | 'modern' | 'minimal' | 'premium';

interface BankAccount {
  bank: string;
  number: string;
  name: string;
}

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  { bank: 'BCA', number: '1234567890', name: 'PT Jelajah Nusantara' },
  { bank: 'Mandiri', number: '0987654321', name: 'PT Jelajah Nusantara' },
];

export default function AdminSettingsPage() {
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);

  const [form, setForm] = useState({
    siteTitle: '',
    siteFavicon: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyIcon: '',
    invoiceTheme: 'modern' as InvoiceTheme,
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [editingBank, setEditingBank] = useState<BankAccount>({ bank: '', number: '', name: '' });
  const [editBankIndex, setEditBankIndex] = useState<number | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setForm((prev) => ({
            ...prev,
            siteTitle: data.data.site_title || '',
            siteFavicon: data.data.site_favicon || '',
            companyName: data.data.company_name || '',
            companyEmail: data.data.company_email || '',
            companyPhone: data.data.company_phone || '',
            companyAddress: data.data.company_address || '',
            companyIcon: data.data.company_icon || '',
            invoiceTheme: (data.data.invoice_theme as InvoiceTheme) || 'modern',
          }));
          if (data.data.bank_accounts && Array.isArray(data.data.bank_accounts)) {
            setBankAccounts(data.data.bank_accounts);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!isSuperAdmin) {
      setShowBlocked(true);
      setTimeout(() => setShowBlocked(false), 3000);
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_title: form.siteTitle,
          site_favicon: form.siteFavicon,
          company_name: form.companyName,
          company_email: form.companyEmail,
          company_phone: form.companyPhone,
          company_address: form.companyAddress,
          company_icon: form.companyIcon,
          invoice_theme: form.invoiceTheme,
          bank_accounts: bankAccounts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        {/* ═══════════ Website Identity ═══════════ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌐 Identitas Website</h2>
          <p className="text-xs text-gray-500 mb-4">Judul dan favicon akan muncul di tab browser dan hasil pencarian Google.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Website (Title Tag)</label>
              <input
                type="text"
                value={form.siteTitle}
                onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jelajah Nusantara - Booking Tour & Aktivitas"
              />
              <p className="text-xs text-gray-400 mt-1">Contoh: Jelajah Nusantara — Booking Tour Terpercaya</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon (32×32 PNG)</label>
              <ImageUpload
                value={form.siteFavicon || ''}
                onChange={(url) => setForm({ ...form, siteFavicon: url })}
                label=""
                folder="tour-booking/site"
                placeholder="Upload favicon 32x32 PNG"
              />
              <p className="text-xs text-gray-400 mt-1">Upload gambar kecil 32×32 pixel. Kalau kosong, pakai default.</p>
            </div>
          </div>
        </div>

        {/* Brand Identity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Brand Identity</h2>
          <p className="text-xs text-gray-500 mb-4">Nama brand dan icon akan muncul di seluruh website (sidebar, footer, invoice).</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Brand</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jelajah Nusantara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon Brand (upload atau teks)</label>
              <ImageUpload
                value={form.companyIcon || ''}
                onChange={(url) => setForm({ ...form, companyIcon: url })}
                label=""
                folder="tour-booking/brand"
                placeholder="JN (teks) atau upload logo"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Bisnis</label>
                <input
                  type="email"
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@bisnis.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={form.companyPhone}
                  onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+62 812-3456-7890"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Perusahaan</label>
              <input
                type="text"
                value={form.companyAddress}
                onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jl. Pariwisata No. 123, Jakarta Selatan"
              />
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">🏦 Rekening Bank</h2>
              <p className="text-xs text-gray-500 mt-1">Rekening yang muncul di halaman invoice untuk pembayaran customer.</p>
            </div>
            {!showBankForm && (
              <button
                onClick={() => {
                  setEditBankIndex(null);
                  setEditingBank({ bank: '', number: '', name: '' });
                  setShowBankForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                + Tambah Rekening
              </button>
            )}
          </div>

          {/* Bank list */}
          {bankAccounts.length > 0 && (
            <div className="space-y-2 mb-4">
              {bankAccounts.map((bank, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {bank.bank.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        Bank {bank.bank}
                      </p>
                      <p className="text-xs font-mono text-gray-600 truncate">
                        {bank.number}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        a.n. {bank.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => {
                        setEditBankIndex(idx);
                        setEditingBank({ ...bank });
                        setShowBankForm(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus rekening Bank ${bank.bank}?`)) {
                          setBankAccounts((prev) => prev.filter((_, i) => i !== idx));
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bankAccounts.length === 0 && !showBankForm && (
            <p className="text-sm text-gray-400 mb-4">Belum ada rekening bank. Klik &quot;Tambah Rekening&quot; untuk menambahkan.</p>
          )}

          {/* Add / Edit Bank Form */}
          {showBankForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                {editBankIndex !== null ? 'Edit Rekening' : 'Tambah Rekening Baru'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={editingBank.bank}
                    onChange={(e) => setEditingBank({ ...editingBank, bank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="BCA / Mandiri / BNI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={editingBank.number}
                    onChange={(e) => setEditingBank({ ...editingBank, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Atas Nama</label>
                  <input
                    type="text"
                    value={editingBank.name}
                    onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PT Jelajah Nusantara"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    if (!editingBank.bank.trim() || !editingBank.number.trim() || !editingBank.name.trim()) {
                      alert('Semua field harus diisi');
                      return;
                    }
                    if (editBankIndex !== null) {
                      // Update existing
                      setBankAccounts((prev) =>
                        prev.map((b, i) => (i === editBankIndex ? { ...editingBank } : b))
                      );
                    } else {
                      // Add new
                      setBankAccounts((prev) => [...prev, { ...editingBank }]);
                    }
                    setShowBankForm(false);
                    setEditBankIndex(null);
                    setEditingBank({ bank: '', number: '', name: '' });
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {editBankIndex !== null ? '✅ Simpan' : '➕ Simpan'}
                </button>
                <button
                  onClick={() => {
                    setShowBankForm(false);
                    setEditBankIndex(null);
                    setEditingBank({ bank: '', number: '', name: '' });
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Theme */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">🎨 Tema Invoice</h2>
          <p className="text-sm text-gray-500 mb-4">Pilih tema invoice, lalu klik <strong>Edit</strong> untuk kustomisasi warna, status badge, dan footer tema tersebut.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { key: 'classic' as InvoiceTheme, label: 'Klasik', desc: 'Elegan gelap & biru', preview: 'bg-slate-800' },
              { key: 'modern' as InvoiceTheme, label: 'Modern', desc: 'Gradient biru segar', preview: 'bg-gradient-to-r from-blue-600 to-indigo-700' },
              { key: 'minimal' as InvoiceTheme, label: 'Minimal', desc: 'Bersih & simpel', preview: 'bg-white border-2 border-gray-900' },
              { key: 'premium' as InvoiceTheme, label: 'Premium', desc: 'Geometris hitam & emas', preview: 'bg-[#1A1A1A]' },
            ]).map((theme) => (
              <div
                key={theme.key}
                onClick={() => setForm({ ...form, invoiceTheme: theme.key })}
                className={`relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                  form.invoiceTheme === theme.key
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-12 rounded-lg mb-3 ${theme.preview} flex items-center justify-center`}>
                  <span className={theme.key === 'minimal' ? 'text-gray-900 text-xs font-bold' : 'text-white text-xs font-bold'}>
                    INVOICE
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{theme.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">{theme.desc}</p>
                <div className="flex items-center gap-2">
                  {form.invoiceTheme === theme.key && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">✓ Dipilih</span>
                  )}
                  <a
                    href={`/admin/pages/invoice-${theme.key}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline ml-auto"
                  >
                    ✏️ Edit
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="border-t pt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || roleLoading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium animate-fade-in">
              ✅ Pengaturan disimpan!
            </span>
          )}
          {showBlocked && (
            <span className="text-red-600 text-sm font-medium animate-fade-in">
              🚫 Hanya Super Admin yang bisa mengubah pengaturan.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
