
'use client';
import AnimateOnScroll from "@/components/AnimateOnScroll";
import AnimatedArrow from "@/components/AnimatedArrow";
import BorderBeam from "@/components/BorderBeam";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Zap, Shield, FileText, Code2, Heart, UploadCloud, Settings, Download } from "lucide-react";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from "react";
import React from "react";
import { cn } from "@/lib/utils";

const whyChooseUsFeatures = [
    {
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'Powerful PDF Tools',
      description: 'Our intuitive interface makes merging, splitting, and compressing PDFs as easy as a few clicks.',
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Privacy First',
      description: 'Your files never leave your browser. We process everything locally to ensure maximum security.',
    },
    {
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Lightning Fast',
      description: 'Built with modern technology to handle your PDFs quickly and efficiently, without server delays.',
    },
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'User-Centric Design',
      description: 'Every feature is designed with our users in mind, making the experience smooth and enjoyable.',
    },
    {
      icon: <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      title: 'Open Source',
      description: 'Our code is open source, allowing for transparency and community contributions.',
    },
    {
      icon: <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'Made with Love',
      description: "We're passionate about creating tools that make your life easier, for free.",
    },
];

const howItWorksSteps = [
    {
        icon: <UploadCloud className="w-10 h-10 text-primary" />,
        title: '1. Upload Your Files',
        description: 'Select your PDFs from your computer. All files are loaded directly into your browser.',
    },
    {
        icon: <Settings className="w-10 h-10 text-primary" />,
        title: '2. Configure Options',
        description: 'Reorder files, select pages, or choose your compression level. Your settings are applied instantly.',
    },
    {
        icon: <Download className="w-10 h-10 text-primary" />,
        title: '3. Download Securely',
        description: 'Your new PDF is generated in your browser and downloaded directly to your device. No uploads needed.',
    }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const CTAButton = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Button
            asChild
            size="lg"
            className="btn-animated-gradient font-bold text-base shadow-md hover:shadow-lg transition-all group w-full sm:w-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href="/#services">
                Start Exploring Now
                <AnimatedArrow isHovered={isHovered} />
            </Link>
        </Button>
    );
};


export default function AboutPage() {
  return (
    <>
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Our Mission
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              About{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                PDFusion
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg">
              We believe that managing PDF documents should be simple, secure, and accessible to everyone. Our mission is to provide a fast and user-friendly toolkit that makes PDF editing effortless while maintaining the highest standards of privacy.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
            <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-bottom-12"
                className="duration-500"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  Why Choose PDFusion?
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                  The <span className="text-primary">Best Choice</span> for Your PDFs
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Discover what makes our PDF toolkit the best choice for your document needs.
                </p>
            </AnimateOnScroll>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
                {whyChooseUsFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="h-full"
                    >
                      <motion.div
                        className="group relative h-full"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
                          <Card className="relative text-card-foreground shadow-sm hover:shadow-xl transition-shadow duration-300 p-4 md:p-6 flex flex-col h-full bg-card rounded-2xl">
                              <CardContent className="p-0 flex-grow">
                                  <div className="flex flex-col items-start gap-4 h-full">
                                      <div className={cn(`p-2 sm:p-3 rounded-lg`, feature.bgColor)}>
                                        {React.cloneElement(feature.icon, { className: cn(feature.icon.props.className, "w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110") })}
                                      </div>
                                      <div className="space-y-2">
                                      <h3 className="text-base sm:text-lg font-bold group-hover:text-primary">{feature.title}</h3>
                                      <p className="text-muted-foreground text-sm sm:text-base">{feature.description}</p>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      </motion.div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
      </section>

       <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-500"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Secure & Simple
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
              Your privacy is our priority. All processing happens securely in your browser.
            </p>
          </AnimateOnScroll>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {howItWorksSteps.map((step, index) => (
                <motion.div key={index} variants={itemVariants} className="flex flex-col items-center h-full">
                  <div className="relative w-full p-6 sm:p-8 overflow-hidden bg-card border border-border/20 shadow-lg h-full flex flex-col rounded-2xl">
                      <div className="flex flex-col items-center text-center flex-grow">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 10 }}
                          >
                            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 shrink-0">
                            {step.icon}
                            </div>
                          </motion.div>
                          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                          <p className="text-muted-foreground flex-grow">{step.description}</p>
                      </div>
                      <BorderBeam size={150} duration={12} delay={index * 2} />
                  </div>
                    {index < howItWorksSteps.length - 1 && (
                    <div className="mt-8 lg:hidden">
                        <AnimateOnScroll
                            animation="animate-in fade-in-0"
                            className="duration-500"
                            delay={index * 200 + 100}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/50">
                                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </AnimateOnScroll>
                    </div>
                    )}
                </motion.div>
            ))}
            </motion.div>
            <div className="hidden lg:flex items-center justify-center -mt-16">
                 <svg width="66%" height="24" viewBox="0 0 800 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/30">
                    <path d="M1 12.5C1 12.5 130.5 12.5 200 12.5C321 12.5 380 12.5 400 12.5C420 12.5 479 12.5 600 12.5C669.5 12.5 799 12.5 799 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="8 8"/>
                </svg>
            </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <AnimateOnScroll
              animation="animate-in fade-in-0"
              className="duration-700"
          >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                From the Creator
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-12">
                A Note from the <span className="text-primary">Creator</span>
              </h2>
          </AnimateOnScroll>

          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-700 delay-150"
          >
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="max-w-2xl mx-auto p-8 shadow-lg text-left flex flex-col sm:flex-row items-center gap-8 bg-card">
                <Avatar className="w-24 h-24 border-4 border-primary/50">
                  <AvatarImage src="/creator-image.png" alt="Creator Garvit Kumar" />
                  <AvatarFallback>GK</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-foreground">Garvit Kumar</h3>
                  <p className="text-primary font-semibold mb-2">Creator & Developer</p>
                  <p className="text-muted-foreground">
                    "I built PDFusion with a simple goal: to create a beautiful, fast, and private tool that solves a common problem. I hope you find it as useful as I do. Thank you for your support!"
                  </p>
                </div>
              </Card>
            </motion.div>
          </AnimateOnScroll>
        </div>
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
                        Ready to <span className="text-primary">Transform</span> Your Workflow?
                      </h2>
                      <p className="max-w-xl mx-auto lg:mx-0 text-muted-foreground text-base md:text-lg mb-8 lg:mb-0">
                        Dive into our suite of tools and see how easy PDF management can be.
                      </p>
                    </AnimateOnScroll>
                  <AnimateOnScroll
                        animation="animate-in fade-in-0 slide-in-from-right-12"
                        className="duration-700 flex-shrink-0 w-full lg:w-auto"
                        delay={200}
                    >
                        <CTAButton />
                  </AnimateOnScroll>
                </div>
              </div>
        </div>
      </section>
    </>
  );
}

    