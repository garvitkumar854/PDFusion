
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PasswordGenerator = dynamic(() => import('@/components/PasswordGenerator').then(mod => mod.PasswordGenerator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PasswordGeneratorLoader() {
  return <PasswordGenerator />;
}
