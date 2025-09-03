
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const ColorPaletteGenerator = dynamic(() => import('@/components/ColorPaletteGenerator'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64 rounded-lg border"><Skeleton className="h-full w-full" /></div>
});

export default function ColorPaletteGeneratorLoader() {
  return <ColorPaletteGenerator />;
}
