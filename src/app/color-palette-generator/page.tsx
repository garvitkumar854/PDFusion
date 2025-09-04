
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import AnimateOnScroll from '@/components/AnimateOnScroll';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGeneratorLoader'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center p-4">
        <Skeleton className="h-full w-full max-w-sm" />
    </div>,
});

export default function ColorPaletteGeneratorPage() {
  return (
    <div className="flex flex-col flex-1 h-full font-inter py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
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
      <ColorPaletteGeneratorLoader />
    </div>
  );
}
