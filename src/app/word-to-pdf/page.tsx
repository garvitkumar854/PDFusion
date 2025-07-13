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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
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
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Seamlessly
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M1 10.3c15.2-4.1 31.4-6.3 47.7-6.3 16.3 0 32.5 2.2 47.7 6.3"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
