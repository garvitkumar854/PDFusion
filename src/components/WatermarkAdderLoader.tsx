
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const WatermarkAdder = dynamic(() => import('@/components/WatermarkAdder').then(mod => mod.WatermarkAdder), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function WatermarkAdderLoader() {
  return <WatermarkAdder />;
}
