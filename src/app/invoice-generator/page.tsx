
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const InvoiceGeneratorLoader = dynamic(() => import('@/components/InvoiceGeneratorLoader'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 h-[70vh]">
        <Skeleton className="w-1/2 h-8" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});


export default function InvoiceGeneratorPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <main className="flex-1 w-full flex flex-col">
          <InvoiceGeneratorLoader />
        </main>
      </div>
    </>
  );
}
