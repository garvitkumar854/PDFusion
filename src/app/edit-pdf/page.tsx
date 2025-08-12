'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PdfEditorLoader = dynamic(() => import('@/components/PdfEditorLoader'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed">
             <Skeleton className="w-12 h-12 rounded-full" />
             <Skeleton className="h-6 w-48 mt-4" />
             <Skeleton className="h-4 w-64 mt-2" />
             <Skeleton className="h-10 w-32 mt-4" />
        </div>
    </div>
  )
});

export default function EditPdfPage() {
  return (
    <div className="flex flex-col flex-1 py-4 h-full">
      <section className="text-center mb-4">
        <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            Edit PDF
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-sm">
            Add text, images, and shapes to your PDF document with an intuitive, browser-based editor.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full h-full">
        <div className="max-w-full mx-auto h-full">
          <PdfEditorLoader />
        </div>
      </main>
    </div>
  );
}
