
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PdfOrganizer = dynamic(() => import('@/components/PdfOrganizer').then(mod => mod.PdfOrganizer), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PdfOrganizerLoader({ onFileChange }: { onFileChange?: (isFile: boolean) => void }) {
  return <PdfOrganizer onFileChange={onFileChange} />;
}
