
'use client';

import { Wrench, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AnimateOnScroll from './AnimateOnScroll';

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <AnimateOnScroll
        animation="animate-in fade-in-0 zoom-in-95"
        className="duration-500"
      >
        <div className="p-6 bg-primary/10 rounded-full mb-8">
          <Wrench className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
        </div>
      </AnimateOnScroll>
      <AnimateOnScroll
        animation="animate-in fade-in-0 slide-in-from-bottom-12"
        className="duration-500 delay-100"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
          Coming Soon!
        </h1>
        <p className="max-w-md mx-auto text-muted-foreground text-base md:text-lg">
          This feature is currently under construction. We are working hard to bring it to you as soon as possible.
        </p>
      </AnimateOnScroll>
       <AnimateOnScroll
        animation="animate-in fade-in-0 slide-in-from-bottom-12"
        className="duration-500 delay-200 mt-8"
      >
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
          </Link>
        </Button>
      </AnimateOnScroll>
    </div>
  );
}
