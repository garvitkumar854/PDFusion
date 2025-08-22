
'use client';

import { usePwa } from '@/hooks/use-pwa';
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { Toaster } from '@/components/ui/toaster';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  usePwa();

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <FooterLoader />
      <Toaster />
    </>
  );
}
