
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const DocxToPdfConverter = dynamic(() => import('@/components/DocxToPdfConverter').then(mod => mod.DocxToPdfConverter), {
  ssr: false,
  loading: () => (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed">
             <Skeleton className="w-12 h-12 rounded-full" />
             <Skeleton className="h-6 w-48 mt-4" />
             <Skeleton className="h-4 w-64 mt-2" />
             <Skeleton className="h-10 w-32 mt-4" />
        </div>
    </div>
  ),
});

export default function DocxToPdfLoader() {
  return <DocxToPdfConverter />;
}
