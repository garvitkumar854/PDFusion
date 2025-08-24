
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
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
      <div className="flex flex-col flex-1 h-[calc(100vh-100px)]">
        <main className="flex-1 w-full h-full">
            <ColorPaletteGeneratorLoader />
        </main>
      </div>
    </>
  );
}
