
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const ColorPaletteGenerator = dynamic(() => import('@/components/ColorPaletteGenerator'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center p-4">
      <Skeleton className="h-64 w-full" />
    </div>
  )
});

export default function ColorPaletteGeneratorLoader() {
  return <ColorPaletteGenerator />;
}
