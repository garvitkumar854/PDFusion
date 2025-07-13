"use client";

import dynamic from 'next/dynamic';

const JpgToPdfConverter = dynamic(() => import('@/components/JpgToPdfConverter').then(mod => mod.JpgToPdfConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>
});

export default function JpgToPdfLoader() {
  return <JpgToPdfConverter />;
}
