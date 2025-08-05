"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfToHtmlConverter = dynamic(() => import('@/components/PdfToHtmlConverter').then(mod => mod.PdfToHtmlConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfToHtmlLoader() {
  return <PdfToHtmlConverter />;
}
