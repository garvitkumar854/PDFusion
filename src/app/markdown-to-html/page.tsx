
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap, Code, FileDown, Pencil } from 'lucide-react';

const MarkdownToHtmlLoader = dynamic(() => import('@/components/MarkdownToHtmlLoader'), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-2 gap-4 h-[60vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});

const features = [
    {
        icon: <Pencil className="w-8 h-8 text-blue-500" />,
        title: 'Live Preview',
        description: 'See your HTML output update in real-time as you type your Markdown content.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Client-Side Conversion',
        description: 'Your data is processed entirely in your browser. Nothing is ever sent to our servers, ensuring your privacy.',
    },
    {
        icon: <Code className="w-8 h-8 text-purple-500" />,
        title: 'Copy or Download',
        description: 'Quickly copy the generated HTML to your clipboard or download it as a complete .html file.',
    },
];

const howToSteps = [
    {
        title: 'Write Markdown',
        description: 'Type or paste your Markdown content into the editor on the left.',
    },
    {
        title: 'See Instant Preview',
        description: 'The HTML output will appear in the preview pane on the right as you type.',
    },
    {
        title: 'Copy or Download',
        description: 'Use the buttons in the toolbar to copy the HTML code or download the complete .html file.',
    },
];


export default function MarkdownToHtmlPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Markdown to HTML
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Live Converter</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Instantly convert your Markdown into clean, formatted HTML with a side-by-side live preview.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto">
            <MarkdownToHtmlLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Simple & Powerful Conversion"
          description="Our Markdown to HTML converter is designed for speed, privacy, and ease of use."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert Markdown to HTML"
        />

      </div>
    </>
  );
}
