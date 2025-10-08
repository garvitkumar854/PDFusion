
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';

const UnitConverterLoader = dynamic(() => import('@/components/UnitConverterLoader'), {
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
        title: 'Wide Range of Categories',
        description: 'Convert between various units for length, mass, temperature, time, volume, speed, area, data, and numeral systems.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Bidirectional Conversion',
        description: 'Enter a value in either the "From" or "To" field and see the other field update instantly. Swap units with a single click.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Real-time & Accurate',
        description: 'All calculations happen instantly as you type, providing quick and precise results without any delay.',
    },
];

const howToSteps = [
    {
        title: 'Select a Category',
        description: 'Choose the type of conversion you want to perform, such as Length, Mass, or Temperature.',
    },
    {
        title: 'Choose Units',
        description: 'Select the "From" and "To" units from the dropdown menus for your chosen category.',
    },
    {
        title: 'Enter Value to Convert',
        description: 'Type a value into either input field to see the real-time conversion in the other field.',
    },
];

export default function UnitConverterPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Unit Converter
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Instantly</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              A versatile and easy-to-use tool for all your conversion needs.
            </p>
          </AnimateOnScroll>
        </section>

        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            <UnitConverterLoader />
          </div>
        </main>

        <FeatureGrid
          title="The Only Converter You'll Need"
          description="Our unit converter is designed for versatility, providing instant and accurate conversions across a wide range of categories."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Convert Units"
        />

      </div>
    </>
  );
}
