
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const PdfOrganizerLoader = dynamic(() => import('@/components/PdfOrganizerLoader'), {
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

export default function OrganizePdfPage() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const isMobile = useIsMobile();
  const showHeader = !isMobile || !isFileUploaded;

  return (
    <>
      <div className={cn("flex flex-col flex-1", showHeader ? "py-8 sm:py-12" : "pt-4")}>
        {showHeader && (
           <section className="text-center mb-12">
              <AnimateOnScroll
                  animation="animate-in fade-in-0 slide-in-from-bottom-12"
                  className="duration-500"
              >
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
                  Organize PDF Pages
                  <br />
                  <span className="relative inline-block">
                    <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Visually</span>
                  </span>
                </h1>
                <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
                  Easily reorder, rotate, and delete pages from your PDF with a simple drag-and-drop interface.
                </p>
              </AnimateOnScroll>
            </section>
        )}
        
        <main className="flex-1 w-full">
          <div className="max-w-full mx-auto">
            <PdfOrganizerLoader onFileChange={setIsFileUploaded} />
          </div>
        </main>
      </div>
    </>
  );
}
