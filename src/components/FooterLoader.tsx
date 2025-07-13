"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <footer className="py-6 border-t bg-background">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
    </footer>
});

export default function FooterLoader() {
  return <Footer />;
}
