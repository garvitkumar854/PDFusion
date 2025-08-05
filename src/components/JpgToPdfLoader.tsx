"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const JpgToPdfConverter = dynamic(() => import('@/components/JpgToPdfConverter').then(mod => mod.JpgToPdfConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function JpgToPdfLoader() {
  return <JpgToPdfConverter />;
}
