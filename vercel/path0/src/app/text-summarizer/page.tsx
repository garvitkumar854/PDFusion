
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { FileText, Zap, BrainCircuit } from 'lucide-react';

const TextSummarizerLoader = dynamic(() => import('@/components/TextSummarizerLoader'), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
    </div>
  )
});

const features = [
    {
        icon: <BrainCircuit className="w-8 h-8 text-blue-500" />,
        title: 'AI-Powered Summaries',
        description: 'Our advanced AI reads and understands your text to provide accurate and concise summaries.',
    },
    {
        icon: <Zap className="w-8 h-8 text-green-500" />,
        title: 'Instant Results',
        description: 'Get your summary in seconds. Just paste your text and click the button to see the magic happen.',
    },
    {
        icon: <FileText className="w-8 h-8 text-purple-500" />,
        title: 'Copy with a Click',
        description: 'Easily copy the generated summary to your clipboard to use wherever you need it.',
    },
];

const howToSteps = [
    {
        title: 'Paste Your Text',
        description: 'Copy and paste the text you want to summarize into the input box on the left.',
    },
    {
        title: 'Generate Summary',
        description: 'Click the "Summarize" button and let our AI analyze the text for you.',
    },
    {
        title: 'Copy and Use',
        description: 'Your concise summary will appear on the right. Copy it and use it anywhere you like!',
    },
];


export default function TextSummarizerPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              AI Text Summarizer
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Get the Gist, Fast</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Our AI-powered tool helps you quickly summarize long articles, documents, and other texts.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full flex flex-col">
          <TextSummarizerLoader />
        </main>
        
        <FeatureGrid
          title="Understand More, Read Less"
          description="Our Text Summarizer is designed for efficiency, privacy, and accuracy."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Summarize Text"
        />

      </div>
    </>
  );
}
