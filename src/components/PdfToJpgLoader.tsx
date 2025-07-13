"use client";

import dynamic from 'next/dynamic';

const PdfToJpgConverter = dynamic(() => import('@/components/PdfToJpgConverter').then(mod => mod.PdfToJpgConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
});

export default function PdfToJpgLoader() {
  return <PdfToJpgConverter />;
}
