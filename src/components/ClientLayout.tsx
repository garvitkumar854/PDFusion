
'use client';

import { usePwa } from '@/hooks/use-pwa';
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  usePwa();
  const pathname = usePathname();
  const isColorPage = pathname === '/color-palette-generator';

  return (
    <>
      <Header />
      <main className={cn(
        "flex-1", 
        !isColorPage && "container mx-auto px-4 sm:px-6 lg:px-8"
      )}>
        {children}
      </main>
      <FooterLoader />
      <Toaster />
    </>
  );
}
