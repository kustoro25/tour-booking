import type { Metadata } from 'next';
import { getBrandName, getBrandIcon } from '@/lib/brand';
import AdminShell from './AdminShell';

// Area admin selalu dirender ulang (data per-user, tidak boleh masuk cache publik).
export const dynamic = 'force-dynamic';

// Area admin tidak boleh diindeks mesin pencari.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [brandName, brandIcon] = await Promise.all([getBrandName(), getBrandIcon()]);

  return (
    <AdminShell brandName={brandName} brandIcon={brandIcon}>
      {children}
    </AdminShell>
  );
}
