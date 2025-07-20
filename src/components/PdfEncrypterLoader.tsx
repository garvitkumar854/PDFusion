
"use client";

import dynamic from 'next/dynamic';

const PdfEncrypter = dynamic(() => import('@/components/PdfEncrypter').then(mod => mod.PdfEncrypter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
});

interface PdfEncrypterLoaderProps {
    mode: 'lock' | 'unlock';
}

export default function PdfEncrypterLoader({ mode }: PdfEncrypterLoaderProps) {
  return <PdfEncrypter mode={mode} />;
}
