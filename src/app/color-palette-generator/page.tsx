
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ColorPaletteGeneratorLoader = dynamic(() => import('@/components/ColorPaletteGeneratorLoader'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center p-4">
        <Skeleton className="h-full w-full max-w-sm" />
    </div>,
});

export default function ColorPaletteGeneratorPage() {
  return (
    <div className="flex flex-col flex-1 h-full font-inter">
      <ColorPaletteGeneratorLoader />
    </div>
  );
}
