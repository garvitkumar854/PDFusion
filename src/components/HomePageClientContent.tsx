
'use client';

import { ArrowUpRight, Wand2, Combine, Scissors, Image, Hash, RotateCw, ListOrdered, Code, ShieldCheck, FileText, Zap, FileArchive } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CheckIcon from '@/components/CheckIcon';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const services = [
    {
      icon: <Combine className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, organized document with ease.',
      href: '/merger'
    },
    {
      icon: <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Split PDF',
      description: 'Extract specific pages or page ranges from a PDF into separate files.',
      href: '/split-pdf'
    },
    {
      icon: <FileArchive className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Compress PDF',
      description: 'Reduce the file size of your PDFs while maintaining quality.',
      href: '/compress-pdf'
    },
    {
      icon: <ListOrdered className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      title: 'Organize PDF',
      description: 'Visually reorder, rotate, and delete pages in your PDF document.',
      href: '/organize-pdf'
    },
    {
      icon: <Image className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'PDF to JPG',
      description: 'Convert each page of a PDF into a high-quality JPG image.',
      href: '/pdf-to-jpg'
    },
     {
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'JPG to PDF',
      description: 'Convert JPG images to a PDF file with orientation and margin options.',
      href: '/jpg-to-pdf'
    },
    {
      icon: <Code className="w-6 h-6 sm:w-8 sm:h-8 text-lime-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-lime-100 dark:bg-lime-900/20',
      title: 'PDF to HTML',
      description: 'Convert your PDF into a basic, editable HTML file.',
      href: '/pdf-to-html'
    },
    {
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      title: 'HTML to PDF',
      description: 'Convert any webpage into a PDF document.',
      href: '/html-to-pdf'
    },
    {
      icon: <RotateCw className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      title: 'Rotate PDF',
      description: 'Rotate all pages in a PDF document by 90, 180, or 270 degrees.',
      href: '/rotate-pdf'
    },
    {
      icon: <Hash className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      title: 'Add Page Numbers',
      description: 'Easily insert page numbers into your PDF with custom positions.',
      href: '/add-page-numbers'
    },
];

const futureFeatures = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500 transition-transform group-hover:scale-110 sm:w-6 sm:h-6" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Lightning Fast',
      description: 'Merge your PDFs in seconds with our optimized processing engine',
      points: ['Client-side processing', 'Instant preview', 'Quick downloads'],
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-green-500 transition-transform group-hover:scale-110 sm:w-6 sm:h-6" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Secure & Private',
      description: 'Your files are processed locally and never stored on our servers',
      points: ['No file uploads', 'End-to-end encryption', 'GDPR compliant'],
    },
    {
      icon: <FileText className="w-5 h-5 text-green-500 transition-transform group-hover:scale-110 sm:w-6 sm:h-6" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Advanced Features',
      description: 'Powerful tools to handle your PDF needs',
      points: ['Page reordering', 'Rotation support', 'Preview thumbnails'],
    },
];

const rotatingWords = [
    { text: "Effortless", color: "#8B5CF6" },
    { text: "Modern", color: "#EC4899" },
    { text: "Secure", color: "#10B981" },
    { text: "Encrypted", color: "#F59E0B" },
    { text: "Trusted", color: "#3B82F6" },
    { text: "User-Friendly", color: "#EF4444" },
    { text: "Zero Hassle", color: "#14B8A6" },
    { text: "Minimalist", color: "#6366F1" },
    { text: "Lightning Fast", color: "#F97316" },
    { text: "Reliable", color: "#06B6D4" },
    { text: "Private", color: "#22C55E" },
    { text: "No Sign-Up", color: "#D946EF" },
    { text: "Instant Results", color: "#A855F7" },
    { text: "Serverless", color: "#EAB308" },
    { text: "Progressive", color: "#818CF8" },
    { text: "Seamless", color: "#FB923C" },
    { text: "Privacy-First", color: "#4ADE80" },
    { text: "Optimized", color: "#60A5FA" },
    { text: "Efficient", color: "#F472B6" },
    { text: "Instant Access", color: "#34D399" },
];


const WordRotator = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
        }, 2000); // 2 seconds per word
        return () => clearInterval(interval);
    }, []);

    const variants = {
        enter: {
            opacity: 0,
            y: 20,
        },
        center: {
            opacity: 1,
            y: 0,
        },
        exit: {
            opacity: 0,
            y: -20,
        },
    };

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={index}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    y: { type: "spring", stiffness: 200, damping: 20 },
                    opacity: { duration: 0.3 }
                }}
                style={{ color: rotatingWords[index].color }}
                className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
            >
                {rotatingWords[index].text}
            </motion.span>
        </AnimatePresence>
    );
};

const serviceListVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  hidden: {
    opacity: 0,
  },
}

const serviceItemVariants = {
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  hidden: { opacity: 0, y: 20 },
}


export default function HomePageClientContent({ showServices }: { showServices?: boolean }) {
    if (!showServices) {
        return <WordRotator />;
    }
    
    return (
        <>
            <section id="services" className="pb-20 md:pb-32" style={{ scrollMarginTop: '6rem' }}>
                <div className="container mx-auto px-4">
                <AnimateOnScroll
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-500 mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                        <Wand2 className="w-4 h-4" />
                        Our Services
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        What Can We <span className="text-primary">Help You With?</span>
                    </h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg">
                        Choose from our growing list of tools to handle your PDF tasks.
                    </p>
                </AnimateOnScroll>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={serviceListVariants}
                >
                    {services.map((service, index) => (
                    <motion.div
                        key={index}
                        variants={serviceItemVariants}
                        className="h-full"
                    >
                        <Link href={service.href} className="h-full block group relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
                          <Card className="relative text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col bg-card">
                              <CardHeader className="flex-row items-start gap-4 p-4 pb-2 md:p-6 md:pb-2">
                                  <div className={`p-2 sm:p-3 rounded-lg ${service.bgColor}`}>
                                  {service.icon}
                                  </div>
                                  <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug pt-1">
                                  {service.title}
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="flex-grow p-4 pt-2 md:p-6 md:pt-2">
                                  <p className="text-muted-foreground text-sm">{service.description}</p>
                              </CardContent>
                          </Card>
                        </Link>
                    </motion.div>
                    ))}
                </motion.div>
                </div>
            </section>

            <section className="pb-20 md:pb-32">
                <AnimateOnScroll
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-500"
                >
                    <div className="container mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                        <Wand2 className="w-4 h-4" />
                        Why Choose PDFusion?
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        Experience the <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Future of PDF Tools</span>
                        </h2>
                        <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                        Discover the most intuitive and powerful PDF tools available online. Built with cutting-edge technology for the best user experience.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left grid-auto-rows-fr">
                        {futureFeatures.map((feature, index) => (
                            <AnimateOnScroll
                            key={index}
                            animation="animate-in fade-in-0"
                            className="duration-700 h-full"
                            delay={index * 250}
                            >
                            <div className="group relative h-full">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
                                <Card className="relative shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 md:p-6 flex flex-col h-full bg-card">
                                    <CardContent className="p-0 flex-grow">
                                    <div className="flex flex-col items-start gap-4 h-full">
                                        <div className={`p-2 sm:p-3 rounded-lg ${feature.bgColor}`}>
                                        {feature.icon}
                                        </div>
                                        <div className="space-y-2 flex-grow">
                                        <h3 className="text-base font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                                        </div>
                                        <ul className="space-y-3 mt-4">
                                        {feature.points.map((point, pointIndex) => (
                                            <li key={pointIndex} className="flex items-center gap-3">
                                            <CheckIcon className="w-5 h-5 text-primary" />
                                            <span className="text-muted-foreground text-sm">{point}</span>
                                            </li>
                                        ))}
                                        </ul>
                                    </div>
                                    </CardContent>
                                </Card>
                            </div>
                            </AnimateOnScroll>
                        ))}
                        </div>
                    </div>
                </AnimateOnScroll>
            </section>

            <section className="pb-20 md:pb-24">
                <div className="container mx-auto px-4">
                    <div className="relative bg-card p-8 lg:p-12 overflow-hidden shadow-xl border border-primary/20 rounded-2xl">
                        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15),transparent_60%)] -z-0" aria-hidden="true"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                            <AnimateOnScroll
                                animation="animate-in fade-in-0 slide-in-from-left-12"
                                className="duration-700 w-full"
                            >
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-4">
                                    Ready to <span className="text-primary">Streamline</span> Your PDFs?
                                </h2>
                                <p className="max-w-xl mx-auto lg:mx-0 text-muted-foreground text-base md:text-lg mb-8 lg:mb-0">
                                    Experience the simplicity and security of PDFusion for yourself.
                                </p>
                            </AnimateOnScroll>
                            <AnimateOnScroll
                                animation="animate-in fade-in-0 slide-in-from-right-12"
                                className="duration-700 flex-shrink-0 w-full lg:w-auto"
                                delay={200}
                            >
                                <Button asChild size="lg" className="btn-animated-gradient font-bold text-base shadow-md hover:shadow-lg transition-all group w-full sm:w-auto">
                                <Link href="#services">
                                    Explore Services
                                    <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                                </Button>
                            </AnimateOnScroll>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
