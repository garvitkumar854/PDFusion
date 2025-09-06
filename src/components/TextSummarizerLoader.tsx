
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const TextSummarizer = dynamic(() => import('@/components/TextSummarizer').then(mod => mod.TextSummarizer), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function TextSummarizerLoader() {
  return <TextSummarizer />;
}
