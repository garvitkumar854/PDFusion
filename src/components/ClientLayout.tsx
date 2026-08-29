'use client';

import FooterLoader from '@/components/FooterLoader';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () =>
      mediaQuery.matches || (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone());
    mediaQuery.addEventListener('change', checkStandalone);

    return () => mediaQuery.removeEventListener('change', checkStandalone);
  }, []);

  const isUnitConverterPwa = pathname === '/unit-converter' && isMobile && isStandalone;

  return (
    <>
      <Header />
      <main className={cn(
        "flex-1",
        !isUnitConverterPwa && "container mx-auto px-4 sm:px-6 lg:px-8"
      )}>
        {children}
      </main>
      <FooterLoader />
      <Toaster />
    </>
  );
}
