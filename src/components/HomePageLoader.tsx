
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const HomePageClientContent = dynamic(() => import('@/components/HomePageClientContent'), {
  ssr: false,
  loading: () => <Skeleton className="w-48 h-12" />
});

export default function HomePageLoader({ showServices }: { showServices?: boolean }) {
  return <HomePageClientContent showServices={showServices} />;
}
