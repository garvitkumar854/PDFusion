"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfToJpgConverter = dynamic(() => import('@/components/PdfToJpgConverter').then(mod => mod.PdfToJpgConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfToJpgLoader() {
  return <PdfToJpgConverter />;
}
