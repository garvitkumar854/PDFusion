
"use client";

import dynamic from 'next/dynamic';
import LoadingDots from './LoadingDots';

const MarkdownToHtmlConverter = dynamic(() => import('@/components/MarkdownToHtmlConverter').then(mod => mod.MarkdownToHtmlConverter), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function MarkdownToHtmlLoader() {
  return <MarkdownToHtmlConverter />;
}
