import type { Metadata } from 'next';
import FaqClient from '@/components/pages/FaqClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAQ',
};

export default function FaqPage() {
  return <FaqClient />;
}
