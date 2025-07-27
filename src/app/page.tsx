
'use client';

import { ArrowUpRight, Wand2, Combine, Scissors, FileArchive, Image, Hash, RotateCw, ListOrdered, Code, Unlock, ShieldCheck, FileText, Zap } from 'lucide-react';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import HomePageLoader from '@/components/HomePageLoader';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};


export default function Home() {

  return (
    <>
      <section className="py-20 md:py-32">
        <motion.div 
          className="container mx-auto px-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
            <motion.div 
              className="inline-block bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6"
              variants={itemVariants}
            >
              ✨ Your All-in-One PDF Toolkit
            </motion.div>
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4"
              variants={itemVariants}
            >
              Powerful PDF Tools,
              <br />
               <span className="relative block h-12 sm:h-16 md:h-20 align-bottom mx-auto">
                  <HomePageLoader />
               </span>
            </motion.h1>
            <motion.p 
              className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg mb-8 mt-4"
              variants={itemVariants}
            >
              Easily merge, convert, and manage your PDF files in one place.
              <br />
              Secure, reliable, and completely free to use.
            </motion.p>
             <motion.div
              className="flex justify-center items-center gap-4"
              variants={itemVariants}
            >
              <Button asChild size="lg" className="btn-animated-gradient font-bold text-base shadow-md hover:shadow-lg transition-all group">
                  <Link href="/#services">
                    Get Started
                  </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold text-base">
                  <Link href="/about">
                    Learn More
                  </Link>
              </Button>
            </motion.div>
        </motion.div>
      </section>

      <HomePageLoader showServices={true} />
    </>
  );
}
