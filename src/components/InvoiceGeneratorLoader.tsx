
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const InvoiceGenerator = dynamic(() => import('@/components/InvoiceGenerator').then(mod => mod.InvoiceGenerator), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function InvoiceGeneratorLoader() {
  return <InvoiceGenerator />;
}
