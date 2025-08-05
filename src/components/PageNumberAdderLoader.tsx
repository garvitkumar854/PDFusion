"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const PageNumberAdder = dynamic(() => import('@/components/PageNumberAdder').then(mod => mod.PageNumberAdder), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function PageNumberAdderLoader() {
  return <PageNumberAdder />;
}
