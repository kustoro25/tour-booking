'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

type InvoiceTheme = 'classic' | 'modern' | 'minimal' | 'premium';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    invoiceTheme: 'modern' as InvoiceTheme,
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setForm((prev) => ({
            ...prev,
            companyName: data.data.company_name || '',
            companyEmail: data.data.company_email || '',
            companyPhone: data.data.company_phone || '',
            invoiceTheme: data.data.invoice_theme || 'modern',
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.companyName,
          company_email: form.companyEmail,
          company_phone: form.companyPhone,
          invoice_theme: form.invoiceTheme,
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
        {/* Business Identity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identitas Bisnis</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Perusahaan</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nama jasa tour Anda"
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
          </div>
        </div>

        {/* Invoice Theme */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Tema Invoice</h2>
          <p className="text-sm text-gray-500 mb-4">Pilih tampilan invoice yang sesuai dengan brand Anda.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              {
                key: 'classic' as InvoiceTheme,
                label: 'Klasik',
                desc: 'Elegan dengan warna gelap',
                preview: 'bg-slate-800',
                accent: 'bg-blue-100 border-blue-300',
              },
              {
                key: 'modern' as InvoiceTheme,
                label: 'Modern',
                desc: 'Gradient biru segar',
                preview: 'bg-gradient-to-r from-blue-600 to-indigo-700',
                accent: 'bg-indigo-100 border-indigo-300',
              },
              {
                key: 'minimal' as InvoiceTheme,
                label: 'Minimal',
                desc: 'Bersih & simpel',
                preview: 'bg-white border-2 border-gray-900',
                accent: 'bg-gray-100 border-gray-300',
              },
              {
                key: 'premium' as InvoiceTheme,
                label: 'Premium',
                desc: 'Geometris hitam & emas',
                preview: 'bg-[#1A1A1A]',
                accent: 'bg-orange-100 border-orange-300',
              },
            ] as const).map((theme) => (
              <button
                key={theme.key}
                onClick={() => setForm({ ...form, invoiceTheme: theme.key })}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
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
                <p className="text-xs text-gray-500 mt-0.5">{theme.desc}</p>
                {form.invoiceTheme === theme.key && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="border-t pt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium animate-fade-in">
              ✅ Pengaturan disimpan!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
