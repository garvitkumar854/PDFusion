"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfEditor = dynamic(() => import('@/components/PdfEditor').then(mod => mod.PdfEditor), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfEditorLoader() {
  return <PdfEditor />;
}
