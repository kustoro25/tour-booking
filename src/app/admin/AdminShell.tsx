'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';

function BrandIcon({ icon, className }: { icon: string; className?: string }) {
  if (!icon) return <div className={`${className} flex items-center justify-center text-sm font-bold`}>JN</div>;
  if (icon.startsWith('http')) {
    return <img src={icon} alt="brand" className={`${className} object-cover`} />;
  }
  return <div className={`${className} flex items-center justify-center text-sm font-bold`}>{icon.substring(0, 2).toUpperCase()}</div>;
}

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Paket Tour', icon: '🏝️' },
  { href: '/admin/destinations', label: 'Destinasi', icon: '🗺️' },
  { href: '/admin/bookings', label: 'Booking', icon: '📋' },
  { href: '/admin/installments', label: 'Angsuran', icon: '💳' },
  { href: '/admin/blog', label: 'Blog', icon: '📝' },
  { href: '/admin/pages', label: 'Halaman CMS', icon: '📄' },
  { href: '/admin/reviews', label: 'Review', icon: '⭐' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: '📧' },
  { href: '/admin/users', label: 'Admin', icon: '👥' },
  { href: '/admin/settings', label: 'Pengaturan', icon: '⚙️' },
];

interface Props {
  brandName: string;
  brandIcon: string;
  children: React.ReactNode;
}

export default function AdminShell({ brandName, brandIcon, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  // Login page — render without sidebar
  if (pathname === '/admin/login') {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile header */}
      <div className="lg:hidden bg-blue-700 text-white p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold">Admin Panel</span>
        <div className="w-6" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 text-white transform transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BrandIcon icon={brandIcon} className="w-7 h-7 bg-blue-600 rounded" />
            <div>
              <p className="font-semibold text-xs">{brandName}</p>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="text-sm">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 p-3 border-t border-gray-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-1.5"
            target="_blank"
          >
            🌐 Lihat Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 w-full"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="lg:ml-56 min-h-screen">
        <main className="p-4 sm:p-6 lg:p-8">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
