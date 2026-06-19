import { getBrandName, getBrandIcon } from '@/lib/brand';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  const brandName = await getBrandName();
  const brandIcon = await getBrandIcon();

  return <LoginForm brandName={brandName} brandIcon={brandIcon} />;
}
