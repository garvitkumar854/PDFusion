import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Zap, Shield, FileText, Code2, Heart, ArrowUpRight } from "lucide-react";
import Link from 'next/link';

const whyChooseUsFeatures = [
    {
      icon: <FileText className="w-8 h-8 text-blue-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'PDF Merging Made Simple',
      description: 'Our intuitive interface makes merging PDFs as easy as drag and drop. No technical knowledge required.',
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Privacy First',
      description: 'Your files never leave your browser. We process everything locally to ensure maximum security.',
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Lightning Fast',
      description: 'Built with modern technology to handle your PDFs quickly and efficiently.',
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'User-Centric Design',
      description: 'Every feature is designed with our users in mind, making the experience smooth and enjoyable.',
    },
    {
      icon: <Code2 className="w-8 h-8 text-gray-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      title: 'Open Source',
      description: 'Our code is open source, allowing for transparency and community contributions.',
    },
    {
      icon: <Heart className="w-8 h-8 text-red-500 transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'Made with Love',
      description: "We're passionate about creating tools that make your life easier.",
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
                animation="animate-in fade-in-0"
                className="duration-700 delay-200"
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
                className="duration-500"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  Why Choose Our Tool?
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Why Choose <span className="text-primary">Our Tool?</span>
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Discover what makes our PDF merger the best choice for your document needs.
                </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                {whyChooseUsFeatures.map((feature, index) => (
                    <AnimateOnScroll
                    key={index}
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-700"
                    delay={index * 150}
                    >
                    <Card className="group bg-white dark:bg-card text-card-foreground shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary flex flex-col h-full">
                        <CardContent className="p-0 flex-grow">
                            <div className="flex flex-col items-start gap-4 h-full">
                                <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                                {feature.icon}
                                </div>
                                <div className="space-y-2">
                                <h3 className="text-xl font-bold group-hover:text-primary">{feature.title}</h3>
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

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4 text-center">
          <AnimateOnScroll
              animation="animate-in fade-in-0"
              className="duration-700"
          >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                From the Creator
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-12">
                A Note from the <span className="text-primary">Creator</span>
              </h2>
          </AnimateOnScroll>

          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-700 delay-150"
          >
            <Card className="max-w-2xl mx-auto bg-card/50 dark:bg-card/20 p-8 border border-primary/20 shadow-lg text-left flex flex-col sm:flex-row items-center gap-8">
              <Avatar className="w-24 h-24 border-4 border-primary/50">
                <AvatarImage src="https://placehold.co/150x150.png" alt="Garvit Kumar" data-ai-hint="male portrait" />
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
          </AnimateOnScroll>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-[hsl(223,73%,11%)] rounded-2xl p-8 lg:p-10 overflow-hidden shadow-xl border border-primary/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-left-12"
                className="duration-700 w-full lg:w-auto"
              >
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                    Ready to <span className="text-primary">Try It Out?</span>
                  </h2>
                  <p className="max-w-xl mx-auto lg:mx-0 text-muted-foreground text-base md:text-lg mb-8 lg:mb-0">
                    Experience the simplicity of PDFusion for yourself.
                  </p>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-right-12"
                className="duration-700 w-full lg:w-auto"
              >
                <div className="flex-shrink-0">
                  <Button asChild size="lg" className="font-bold text-base shadow-md hover:shadow-lg hover:scale-105 transition-all group w-full sm:w-auto">
                    <Link href="/merger">
                      Start Merging PDFs
                      <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
