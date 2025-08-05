"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const HtmlToPdfConverter = dynamic(() => import('@/components/HtmlToPdfConverter').then(mod => mod.HtmlToPdfConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function HtmlToPdfLoader() {
  return <HtmlToPdfConverter />;
}
