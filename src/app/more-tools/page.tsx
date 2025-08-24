
'use client';

import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calculator, Currency, QrCode, SlidersHorizontal, LockKeyhole, FileArchive } from "lucide-react";
import Link from 'next/link';
import { motion } from 'framer-motion';

const tools = [
    {
      icon: <Calculator className="w-8 h-8 text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'Calculator',
      description: 'A simple and elegant calculator for your daily needs.',
      href: '/calculator',
    },
    {
      icon: <Currency className="w-8 h-8 text-green-500" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Currency Converter',
      description: 'Convert between different currencies with live exchange rates.',
      href: '/currency-converter',
    },
    {
      icon: <QrCode className="w-8 h-8 text-purple-500" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'QR Code Generator',
      description: 'Create QR codes for URLs, text, contacts, and more.',
      href: '/qr-code-generator',
    },
    {
      icon: <SlidersHorizontal className="w-8 h-8 text-orange-500" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      title: 'Unit Converter',
      description: 'An all-in-one converter for various units of measurement.',
      href: '/unit-converter',
    },
    {
      icon: <LockKeyhole className="w-8 h-8 text-red-500" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'Password Generator',
      description: 'Generate strong and secure passwords for your accounts.',
      href: '/password-generator',
    },
    {
      icon: <FileArchive className="w-8 h-8 text-yellow-500" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Compress PDF',
      description: 'Reduce the file size of your PDF while maintaining quality.',
      href: '/compress-pdf',
    },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function MoreToolsPage() {
  return (
    <div className="flex flex-col flex-1 py-8 sm:py-12">
      <section className="text-center mb-12">
        <AnimateOnScroll
          animation="animate-in fade-in-0 slide-in-from-bottom-12"
          className="duration-500"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            More Tools
            <br />
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">For Your Productivity</span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Explore our collection of other useful utilities designed to make your life easier.
          </p>
        </AnimateOnScroll>
      </section>

      <main className="flex-1 w-full">
        <motion.div 
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          {tools.map((tool) => (
            <motion.div key={tool.href} variants={itemVariants}>
              <Link href={tool.href} className="h-full block group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
                <Card className="relative text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col bg-card">
                  <CardHeader className="flex-row items-start gap-4 p-4 pb-2 md:p-6 md:pb-2">
                    <div className={`p-2 sm:p-3 rounded-lg ${tool.bgColor}`}>
                      {tool.icon}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug pt-1">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-2 md:p-6 md:pt-2">
                    <p className="text-muted-foreground text-sm">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
