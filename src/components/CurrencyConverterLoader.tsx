
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const CurrencyConverter = dynamic(() => import('@/components/CurrencyConverter').then(mod => mod.CurrencyConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function CurrencyConverterLoader() {
  return <CurrencyConverter />;
}
