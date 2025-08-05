"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const MergePdfs = dynamic(() => import('@/components/MergePdfs').then(mod => mod.MergePdfs), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfLoader() {
  return <MergePdfs />;
}
