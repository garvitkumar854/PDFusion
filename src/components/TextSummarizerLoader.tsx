"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const TextSummarizer = dynamic(() => import('@/components/TextSummarizer').then(mod => mod.TextSummarizer), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});

export default function TextSummarizerLoader() {
  return <TextSummarizer />;
}
