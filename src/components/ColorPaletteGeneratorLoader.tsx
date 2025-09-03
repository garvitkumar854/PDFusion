
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const ColorPaletteGenerator = dynamic(() => import('@/components/ColorPaletteGenerator'), {
  ssr: false,
  loading: () => <div className="max-w-6xl mx-auto w-full"><Skeleton className="h-40 w-full rounded-2xl" /></div>
});

export default function ColorPaletteGeneratorLoader() {
  return <ColorPaletteGenerator />;
}
