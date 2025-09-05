
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

const TextSummarizerLoader = dynamic(() => import('@/components/TextSummarizerLoader'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed">
             <Skeleton className="w-12 h-12 rounded-full" />
             <Skeleton className="h-6 w-48 mt-4" />
             <Skeleton className="h-4 w-64 mt-2" />
             <Skeleton className="h-10 w-32 mt-4" />
        </div>
    </div>
  )
});

const features = [
    {
        icon: <Sparkles className="w-8 h-8 text-blue-500" />,
        title: 'AI-Powered Summaries',
        description: 'Leverage the power of Gemini to get high-quality, concise summaries of your text in seconds.',
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        title: 'Secure & Private',
        description: 'Your text is sent directly to the AI for processing and is never stored on our servers, ensuring your privacy.',
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        title: 'Instant Results',
        description: 'No waiting around. Get your summary instantly and copy it with a single click.',
    },
];

const howToSteps = [
    {
        title: 'Paste Your Text',
        description: 'Copy and paste the text you want to summarize into the input field.',
    },
    {
        title: 'Click Summarize',
        description: 'Our AI will process your text and generate a concise summary for you.',
    },
    {
        title: 'Copy Your Summary',
        description: 'Once the summary is ready, you can easily copy it to your clipboard.',
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
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Instantly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Get a quick and accurate summary of any text using the power of AI.
            </p>
          </AnimateOnScroll>
        </section>
        
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <TextSummarizerLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Summarization Made Simple"
          description="Discover why our AI summarizer is the perfect tool for quickly understanding long texts."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Summarize Text"
        />

      </div>
    </>
  );
}
