
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGrid from '@/components/FeatureGrid';
import { ListChecks, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Password Generator',
  description: 'Create strong, random, memorable, or PIN passwords with customizable options. All passwords generated securely in your browser.',
  keywords: ['password generator', 'strong password', 'secure password', 'random password', 'memorable password', 'pin generator'],
};

const PasswordGeneratorLoader = dynamic(() => import('@/components/PasswordGeneratorLoader'), {
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
        title: 'Multiple Password Types',
        description: 'Generate random strings, memorable word-based passwords, or secure PINs to suit any need.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20"><ShieldCheck className="w-8 h-8 text-green-500" /></div>,
        title: 'Highly Secure',
        description: 'All passwords are generated locally in your browser using a cryptographically secure random number generator. Nothing is ever sent to a server.',
    },
    {
        icon: <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20"><Zap className="w-8 h-8 text-yellow-500" /></div>,
        title: 'Fully Customizable',
        description: 'Easily adjust length, character types, capitalization, and separators to meet any security requirement.',
    },
];

const howToSteps = [
    {
        title: 'Choose Password Type',
        description: 'Select between Random, Memorable, or PIN based on your security needs.',
    },
    {
        title: 'Customize Options',
        description: 'Adjust the length and other settings like character inclusion or capitalization.',
    },
    {
        title: 'Copy Your Password',
        description: 'Your new, secure password will be generated instantly. Click the copy button to use it right away.',
    },
];


export default function PasswordGeneratorPage() {
  return (
    <>
      <div className="flex flex-col flex-1 py-8 sm:py-12">
        <section className="text-center mb-12">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Password Generator
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-red-600 to-violet-600 bg-clip-text text-transparent">Securely</span>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              Create strong, random, memorable, or PIN passwords with customizable options.
            </p>
          </AnimateOnScroll>
        </section>

        <main className="flex-1 w-full">
          <div className="max-w-2xl mx-auto">
            <PasswordGeneratorLoader />
          </div>
        </main>
        
        <FeatureGrid
          title="Generate Passwords with Confidence"
          description="Our password generator provides a flexible and secure way to create strong passwords for all your accounts."
          features={features}
          steps={howToSteps}
          stepsTitle="How to Generate a Password"
        />

      </div>
    </>
  );
}
