
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
<<<<<<< HEAD
import { FileText, Lightbulb, Zap, BrainCircuit } from 'lucide-react';
=======
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f

const TextSummarizerLoader = dynamic(() => import('@/components/TextSummarizerLoader'), {
  ssr: false,
  loading: () => (
<<<<<<< HEAD
    <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
        <Skeleton className="w-full h-full" />
        <Skeleton className="w-full h-full" />
=======
    <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-lg border-2 border-dashed">
             <Skeleton className="w-12 h-12 rounded-full" />
             <Skeleton className="h-6 w-48 mt-4" />
             <Skeleton className="h-4 w-64 mt-2" />
             <Skeleton className="h-10 w-32 mt-4" />
        </div>
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
    </div>
  )
});

const features = [
    {
<<<<<<< HEAD
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
=======
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
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
    },
];

const howToSteps = [
    {
        title: 'Paste Your Text',
<<<<<<< HEAD
        description: 'Copy and paste the text you want to summarize into the input box on the left.',
    },
    {
        title: 'Generate Summary',
        description: 'Click the "Summarize" button and let our AI analyze the text for you.',
    },
    {
        title: 'Copy and Use',
        description: 'Your concise summary will appear on the right. Copy it and use it anywhere you like!',
=======
        description: 'Copy and paste the text you want to summarize into the input field.',
    },
    {
        title: 'Click Summarize',
        description: 'Our AI will process your text and generate a concise summary for you.',
    },
    {
        title: 'Copy Your Summary',
        description: 'Once the summary is ready, you can easily copy it to your clipboard.',
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
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
<<<<<<< HEAD
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Get the Gist, Fast</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Our AI-powered tool helps you quickly summarize long articles, documents, and other texts.
=======
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Instantly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Get a quick and accurate summary of any text using the power of AI.
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
            </p>
          </AnimateOnScroll>
        </section>
        
<<<<<<< HEAD
        <main className="flex-1 w-full flex flex-col">
          <TextSummarizerLoader />
        </main>
        
        <FeatureGrid
          title="Understand More, Read Less"
          description="Our Text Summarizer is designed for efficiency, privacy, and accuracy."
=======
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <TextSummarizerLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Summarization Made Simple"
          description="Discover why our AI summarizer is the perfect tool for quickly understanding long texts."
>>>>>>> 4d83a8a61579353434de1f8d218e0c57f9bc372f
          features={features}
          steps={howToSteps}
          stepsTitle="How to Summarize Text"
        />

      </div>
    </>
  );
}
