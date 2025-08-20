
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const QrCodeGenerator = dynamic(() => import('@/components/QrCodeGenerator').then(mod => mod.QrCodeGenerator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function QrCodeGeneratorLoader() {
  return <QrCodeGenerator />;
}
