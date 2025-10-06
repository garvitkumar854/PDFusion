
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfCompressor = dynamic(() => import('@/components/PdfCompressor').then(mod => mod.PdfCompressor), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfCompressorLoader() {
  return <PdfCompressor />;
}
