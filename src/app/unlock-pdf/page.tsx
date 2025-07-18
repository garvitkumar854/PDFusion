
'use client';

import UnlockPdfLoader from '@/components/UnlockPdfLoader';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export default function UnlockPdfPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Unlock PDF Files
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Instantly</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Remove passwords from your PDF files so you can edit them.
            <br />
            We respect your privacy. Files are handled securely in your browser.
          </p>
        </AnimateOnScroll>
      </section>
      
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto">
          <UnlockPdfLoader />
        </div>
      </main>
    </div>
  );
}
