
"use client";

import dynamic from 'next/dynamic';

const PdfUnlocker = dynamic(() => import('@/components/PdfUnlocker').then(mod => mod.PdfUnlocker), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
});

export default function PdfUnlockerLoader() {
  return <PdfUnlocker />;
}
