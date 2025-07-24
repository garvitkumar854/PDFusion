
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AskPdfLoader = dynamic(() => import('@/components/AskPdfLoader'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-[80vh] bg-muted/40 rounded-lg border-2 border-dashed p-4">
        <div className="w-1/3 pr-4 border-r">
             <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 pl-4">
             <Skeleton className="h-full w-full" />
        </div>
    </div>
  )
});

export default function AskPdfPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Ask Your PDF
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">With AI</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Unlock knowledge from your documents. Upload a PDF and start a conversation.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto">
          <AskPdfLoader />
        </div>
      </main>
    </div>
  );
}
