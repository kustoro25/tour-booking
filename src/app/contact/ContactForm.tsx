'use client';

import { useState } from 'react';
import { type ContactData } from './page';
import Button from '@/components/ui/Button';

export default function ContactForm({ data }: { data: ContactData }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(result.error || 'Gagal mengirim pesan');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-block text-blue-600 text-sm font-semibold tracking-wide uppercase mb-2">{data.label}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{data.heading}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{data.subheading}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Contact Info */}
        <div className="md:col-span-1 space-y-4">
          {data.infoCards.map((item) => (
            <div key={item.title} className="bg-white rounded-xl shadow-card p-5 border border-gray-100 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                  <span>{item.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-card p-5 sm:p-8 border border-gray-100">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pesan Terkirim!</h3>
                <p className="text-gray-500 max-w-md mx-auto">Terima kasih telah menghubungi kami. Tim kami akan merespon dalam 1×24 jam.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subjek</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
                    placeholder="Subjek pesan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pesan</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm resize-none"
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={submitting}>
                  ✉️ Kirim Pesan
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
