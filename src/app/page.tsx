
import { ArrowUpRight, Wand2, Combine, Scissors, FileArchive, Image, Hash, RotateCw, ListOrdered, Code, Unlock, ShieldCheck, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import RotatingWords from '@/components/RotatingWords';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CheckIcon from '@/components/CheckIcon';
import HomePageClientContent from '@/components/HomePageClientContent';

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
               <RotatingWords 
                words={[
                  "Effortless.",
                  "Secure.",
                  "Blazing Speed.",
                  "Always Free.",
                  "Privacy First.",
                  "User-Friendly.",
                  "Modern.",
                  "Reliable.",
                  "Instant Magic.",
                  "Total Control.",
                  "Private & Safe.",
                  "Zero Hassle.",
                  "Save Time.",
                  "No Signup.",
                  "Trusted."
                ]}
                colors={[
                  "#F61067", // Pink
                  "#00F0B5", // Mint Green
                  "#2563EB", // Blue
                  "#5E239D", // Purple
                  "#F97316", // Orange
                  "#14b8a6", // Teal
                  "#f59e0b", // Amber
                  "#ef4444", // Red
                  "#8b5cf6", // Violet
                  "#3b82f6", // Blue 500
                  "#22c55e", // Green 500
                  "#ec4899", // Pink 500
                  "#6366f1", // Indigo 500
                  "#d946ef", // Fuchsia 500
                  "#06b6d4"  // Cyan 500
                ]}
              />
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg mb-8 mt-4">
              Easily merge, convert, and manage your PDF files in one place.
              <br />
              Secure, reliable, and completely free to use.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <HomePageClientContent />
    </>
  );
}
