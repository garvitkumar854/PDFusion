
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="w-full">
      <Skeleton className="h-48 w-full" />
    </div>
  )
});

export default function ColorPaletteGeneratorPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-8">
        <AnimateOnScroll
          animation="animate-in fade-in-0 slide-in-from-bottom-12"
          className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            Color Palette Generator
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Instantly Inspired</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Create beautiful color schemes with a single keystroke.
          </p>
        </AnimateOnScroll>
      </section>

      <main className="flex-1 w-full flex flex-col items-center justify-start pt-8">
        <ColorPaletteGeneratorLoader />
      </main>
    </div>
  );
}
