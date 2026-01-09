
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const MarkdownToHtmlConverter = dynamic(() => import('@/components/MarkdownToHtmlConverter').then(mod => mod.MarkdownToHtmlConverter), {
  ssr: false,
  loading: () => (
     <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});

export default function MarkdownToHtmlLoader() {
  return <MarkdownToHtmlConverter />;
}
