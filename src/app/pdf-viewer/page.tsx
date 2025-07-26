
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PdfViewerLoader = dynamic(() => import('@/components/PdfViewerLoader'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col flex-1 w-full h-full space-y-4">
        <div className="flex justify-between items-center p-2 border rounded-lg">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 h-full">
            <div className="h-full hidden md:block">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="h-full">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    </div>
  )
});

export default function PdfViewerPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12 h-full">
      <section className="text-center mb-12">
        <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            PDF Viewer
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Secure & Simple</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            View any PDF directly in your browser.
            <br />
            Supports encrypted files with password prompt.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full flex flex-col h-full min-h-[85vh]">
        <div className="max-w-full mx-auto h-full w-full flex flex-col">
          <PdfViewerLoader />
        </div>
      </main>
    </div>
  );
}
