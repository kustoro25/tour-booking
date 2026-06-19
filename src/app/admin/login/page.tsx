import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getBrandName, getBrandIcon } from '@/lib/brand';
import { getSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  // Redirect already authenticated users to dashboard
  const session = await getSession();
  if (session) {
    redirect('/admin/dashboard');
  }

  const brandName = await getBrandName();
  const brandIcon = await getBrandIcon();

  return (
    <Suspense>
      <LoginForm brandName={brandName} brandIcon={brandIcon} />
    </Suspense>
  );
}
