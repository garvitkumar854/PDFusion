
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGenerator'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col md:flex-row bg-background">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 w-full h-full rounded-none" />
      ))}
    </div>
  )
});

export default function ColorPaletteGeneratorPage() {
  return (
    <div className="flex-1 w-full">
          <ColorPaletteGeneratorLoader />
    </div>
  );
}
