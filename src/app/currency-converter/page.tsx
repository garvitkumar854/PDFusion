
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const CurrencyConverterLoader = dynamic(() => import('@/components/CurrencyConverterLoader'), {
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
        icon: <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20"><ListChecks className="w-8 h-8 text-blue-500" /></div>,
        title: 'Live Exchange Rates',
        description: 'Get the most up-to-date currency exchange rates powered by a reliable external API for accurate conversions.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Wide Range of Currencies',
        description: 'Convert between hundreds of different currencies from around the world with our extensive selection.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant & Bidirectional',
        description: 'Convert amounts instantly in either direction. Change the "From" or "To" value and see the other update automatically.',
    },
];

const howToSteps = [
    {
        title: 'Enter Amount',
        description: 'Enter the amount you wish to convert in the "From" or "To" field.',
    },
    {
        title: 'Select Currencies',
        description: 'Choose your desired "From" and "To" currencies from the dropdown lists.',
    },
    {
        title: 'View Instant Result',
        description: 'The converted amount will appear instantly in the other field, based on the latest exchange rates.',
    },
];

export default function CurrencyConverterPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Currency Converter
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-emerald-500 to-lime-600 bg-clip-text text-transparent">Live Rates</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Convert between different currencies with live exchange rates.
            </p>
          </AnimateOnScroll>
        </section>

        <main className="flex-1 w-full">
          <div className="max-w-2xl mx-auto">
            <CurrencyConverterLoader />
          </div>
        </main>

         <FeatureGrid
          title="Fast & Accurate Conversions"
          description="Our currency converter is designed for speed, accuracy, and ease of use, making it the perfect tool for your conversion needs."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert Currencies"
        />

      </div>
    </>
  );
}
