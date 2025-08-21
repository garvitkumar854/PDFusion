
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const UnitConverter = dynamic(() => import('@/components/UnitConverter').then(mod => mod.UnitConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function UnitConverterLoader() {
  return <UnitConverter />;
}
