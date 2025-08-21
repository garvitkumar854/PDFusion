
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

const UnitConverter = dynamic(() => import('@/components/UnitConverter').then(mod => mod.UnitConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

const UnitConverterPwa = dynamic(() => import('@/components/UnitConverterPwa').then(mod => mod.UnitConverterPwa), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function UnitConverterLoader() {
  const isMobile = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    };
    setIsStandalone(checkStandalone());
  }, []);

  if (isMobile && isStandalone) {
    return <div className="h-full"><UnitConverterPwa /></div>;
  }

  return <UnitConverter />;
}
