
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const ColorPaletteGenerator = dynamic(() => import('@/components/ColorPaletteGenerator'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">
    <div className="grid grid-cols-5 w-full h-full">
      <Skeleton className="h-full w-full rounded-none" />
      <Skeleton className="h-full w-full rounded-none" />
      <Skeleton className="h-full w-full rounded-none" />
      <Skeleton className="h-full w-full rounded-none" />
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  </div>
});

export default function ColorPaletteGeneratorLoader() {
  return <ColorPaletteGenerator />;
}
