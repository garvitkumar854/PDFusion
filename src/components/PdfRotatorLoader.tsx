"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfRotator = dynamic(() => import('@/components/PdfRotator').then(mod => mod.PdfRotator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfRotatorLoader() {
  return <PdfRotator />;
}
