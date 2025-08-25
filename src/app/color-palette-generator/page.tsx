
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="grid grid-cols-5 w-full h-full">
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
});

export default function ColorPaletteGeneratorPage() {
  return (
    <>
      <div className="flex-1 w-full h-[calc(100vh-80px)] -mx-4 sm:-mx-6 lg:-mx-8">
            <ColorPaletteGeneratorLoader />
      </div>
    </>
  );
}
