import type { Metadata } from 'next';
import { getPaymentGateway } from '@/lib/settings';
import FaqClient from '@/components/pages/FaqClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAQ',
};

export default async function FaqPage() {
  const gateway = await getPaymentGateway();
  return <FaqClient gateway={gateway} />;
}
