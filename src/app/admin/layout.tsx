import { getBrandName, getBrandIcon } from '@/lib/brand';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const brandName = await getBrandName();
  const brandIcon = await getBrandIcon();

  return (
    <AdminShell brandName={brandName} brandIcon={brandIcon}>
      {children}
    </AdminShell>
  );
}
