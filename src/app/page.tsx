
import { ArrowUpRight, Wand2, Combine, Scissors, FileArchive, Image, Hash, RotateCw, ListOrdered, Code, Unlock, ShieldCheck, FileText, Zap } from 'lucide-react';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import HomePageLoader from '@/components/HomePageLoader';

export default function Home() {

  return (
    <>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <div className="inline-block bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              ✨ Your All-in-One PDF Toolkit
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              Powerful PDF Tools,
              <br />
               <span className="relative block h-12 sm:h-16 md:h-20 align-bottom mx-auto">
                  <HomePageLoader />
               </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg mb-8 mt-4">
              Easily merge, convert, and manage your PDF files in one place.
              <br />
              Secure, reliable, and completely free to use.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <HomePageLoader showServices={true} />
    </>
  );
}
