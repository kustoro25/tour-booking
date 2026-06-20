'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer, { type FooterCms } from '@/components/layout/Footer';

export default function PublicLayout({ children, brandName, brandIcon, footerCms }: { children: React.ReactNode; brandName?: string; brandIcon?: string; footerCms?: FooterCms }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, always render public layout to avoid hydration mismatch.
  // After mount, swap to admin-only view if on an admin route.
  const isAdmin = mounted && pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header brandName={brandName} brandIcon={brandIcon} />
      <main className="flex-1">{children}</main>
      <Footer footerCms={footerCms} />
    </>
  );
}
