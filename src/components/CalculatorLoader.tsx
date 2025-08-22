
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const Calculator = dynamic(() => import('@/components/Calculator').then(mod => mod.Calculator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function CalculatorLoader() {
  return <Calculator />;
}
