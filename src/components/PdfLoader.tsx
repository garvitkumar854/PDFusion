"use client";

import dynamic from 'next/dynamic';

const MergePdfs = dynamic(() => import('@/components/MergePdfs').then(mod => mod.MergePdfs), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96">Loading...</div>
});

export default function PdfLoader() {
  return <MergePdfs />;
}
