
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const CalculatorLoader = dynamic(() => import('@/components/CalculatorLoader'), {
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
        title: 'Sleek & Modern Interface',
        description: 'Enjoy a clean, visually appealing layout that makes calculations a pleasure, not a chore.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Complete History',
        description: 'Never lose track of your work. Access a full history of your previous calculations with a single click.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Instant & Responsive',
        description: 'Get immediate results as you type, with a smooth and responsive experience on any device.',
    },
];

const howToSteps = [
    {
        title: 'Enter Your Numbers',
        description: 'Use the on-screen buttons to input the numbers for your calculation.',
    },
    {
        title: 'Perform Operations',
        description: 'Use the operator buttons (+, -, ×, ÷) to perform calculations. Use the "=" button to see the final result.',
    },
    {
        title: 'View & Clear History',
        description: 'Click the history icon to see your past calculations or "AC" to clear everything.',
    },
];


export default function CalculatorPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Calculator
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Simple & Elegant</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              A beautifully designed calculator for all your daily needs.
            </p>
          </AnimateOnScroll>
        </section>

        <main className="flex-1 w-full">
          <div className="max-w-md mx-auto">
            <CalculatorLoader />
          </div>
        </main>

        <FeatureGrid
          title="A Calculator That Does More"
          description="Experience a calculator that combines beautiful design with powerful functionality for your everyday tasks."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Use the Calculator"
        />
      </div>
    </>
  );
}
