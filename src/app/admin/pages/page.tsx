'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

const pageSlugs = [
  // ── Landing page sections (in order of appearance) ──
  { slug: 'home-hero', title: 'Home - Hero Section' },
  { slug: 'home-value', title: 'Home - Value Proposition' },
  { slug: 'home-destinations', title: 'Home - Destinasi Impian' },
  { slug: 'home-tours', title: 'Home - Paket Wisata Unggulan' },
  { slug: 'home-gallery', title: 'Home - Jelajah Visual' },
  { slug: 'testimonials', title: 'Home - Testimoni' },
  { slug: 'home-faq', title: 'Home - FAQ Section' },
  { slug: 'home-cta', title: 'Home - CTA (Siap Berpetualang?)' },
  // ── Standalone pages ──
  { slug: 'about', title: 'About Us' },
  { slug: 'contact', title: 'Contact Us' },
  { slug: 'destinations', title: 'Destinations Page' },
  { slug: 'destinations-cta', title: 'Destinations Detail - CTA' },
  { slug: 'tours', title: 'Tours Page' },
  { slug: 'blog', title: 'Blog Page' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'footer', title: 'Footer' },
  // ── Invoice themes (one per theme) ──
  { slug: 'invoice-classic', title: 'Invoice - Classic Theme' },
  { slug: 'invoice-modern', title: 'Invoice - Modern Theme' },
  { slug: 'invoice-minimal', title: 'Invoice - Minimal Theme' },
  { slug: 'invoice-premium', title: 'Invoice - Premium Theme' },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      const data = await res.json();
      if (data.success) setPages(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Merge predefined slugs with existing pages
  const mergedPages = pageSlugs.map((ps) => {
    const existing = pages.find((p) => p.slug === ps.slug);
    return existing || { id: '', slug: ps.slug, title: ps.title, content: '{}', updatedAt: '' };
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Halaman Statis (CMS)</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola konten halaman statis website</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <table className="hidden lg:table w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Halaman</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Terakhir Diupdate</th>
              <th className="px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mergedPages.map((page) => (
              <tr key={page.slug} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{page.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{page.slug}</td>
                <td className="px-4 py-3 text-gray-500">
                  {page.updatedAt ? formatDate(page.updatedAt) : 'Belum diatur'}
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/admin/pages/${page.slug}/edit`}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    ✏️ Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {mergedPages.map((page) => (
            <div key={page.slug} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{page.title}</p>
                  <p className="text-xs font-mono text-gray-400 truncate">{page.slug}</p>
                </div>
                <Link
                  href={`/admin/pages/${page.slug}/edit`}
                  className="shrink-0 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1"
                >
                  ✏️ Edit
                </Link>
              </div>
              <p className="text-xs text-gray-400">
                {page.updatedAt ? formatDate(page.updatedAt) : 'Belum diatur'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
