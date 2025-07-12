import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Zap, ShieldCheck, FileText } from "lucide-react";
import Image from "next/image";

const whyChooseUsFeatures = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Secure & Private',
      description: 'Your files are processed locally and never stored on our servers.',
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Lightning Fast',
      description: 'Merge your PDFs in seconds with our optimized processing engine.',
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'Advanced Features',
      description: 'Powerful tools to handle your PDF needs like page reordering and rotation.',
    },
];


export default function AboutPage() {
  return (
    <>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              About Our Mission
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              About{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                PDFusion
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
              A modern solution for combining PDF files, built with simplicity and security in mind.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4 max-w-4xl">
            <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-bottom-12"
                className="duration-700"
            >
                <Card className="bg-card/50 dark:bg-card/20 p-8 border border-primary/20 shadow-lg">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        Our <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Mission</span>
                    </h2>
                    <p className="text-muted-foreground text-base md:text-lg">
                        We believe that managing PDF documents should be simple and accessible to everyone. Our mission is to provide a secure, fast, and user-friendly tool that makes PDF merging effortless while maintaining the highest standards of privacy and security.
                    </p>
                </Card>
            </AnimateOnScroll>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4 text-center">
            <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-bottom-12"
                className="duration-700"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  Why Choose Us?
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  The PDFusion Advantage
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Discover why millions of users trust PDFusion for their document management needs.
                </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {whyChooseUsFeatures.map((feature, index) => (
                    <AnimateOnScroll
                    key={index}
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-700"
                    delay={index * 150}
                    >
                    <Card className="group bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary flex flex-col h-full">
                        <CardContent className="p-0 flex-grow">
                            <div className="flex flex-col items-start gap-4 h-full">
                                <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                                {feature.icon}
                                </div>
                                <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </AnimateOnScroll>
                ))}
            </div>
        </div>
      </section>
    </>
  );
}