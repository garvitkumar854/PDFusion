"use client";

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const WordToPdfConverter = dynamic(
  () => import('@/components/WordToPdfConverter'),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="p-6 sm:p-10 rounded-lg border bg-card shadow-lg">
            <Skeleton className="h-40 w-full" />
        </div>
        <div className="p-6 sm:p-10 rounded-lg border bg-card shadow-lg">
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }
);

export default function WordToPdfPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll
          animation="animate-in fade-in-0 slide-in-from-bottom-12"
          className="duration-500"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Convert Word to PDF{' '}
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Seamlessly
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Turn your Word documents into high-quality PDFs in just a few clicks.
            <br />
            Secure, fast, and incredibly simple to use.
          </p>
        </AnimateOnScroll>
      </section>

      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto">
          <WordToPdfConverter />
        </div>
      </main>
    </div>
  );
}
