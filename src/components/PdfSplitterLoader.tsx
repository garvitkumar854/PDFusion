"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfSplitter = dynamic(() => import('@/components/PdfSplitter').then(mod => mod.PdfSplitter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfSplitterLoader() {
  return <PdfSplitter />;
}
