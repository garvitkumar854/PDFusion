import { ArrowRight, Wand2, ArrowUpRight, FileText, Layers, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CheckIcon from '@/components/CheckIcon';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export default function Home() {

  const services = [
    {
      icon: <Layers className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-primary/10',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, organized document with ease.',
      href: '/merger'
    },
    {
      icon: <FileText className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />,
      bgColor: 'bg-primary/10',
      title: 'Word to PDF',
      description: 'Convert your Microsoft Word documents to high-quality PDFs in seconds.',
      href: '/word-to-pdf'
    },
  ];

  const futureFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500 transition-transform group-hover:scale-110" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Lightning Fast',
      description: 'Merge your PDFs in seconds with our optimized processing engine',
      points: ['Client-side processing', 'Instant preview', 'Quick downloads'],
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-500 transition-transform group-hover:scale-110" />,
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      title: 'Secure & Private',
      description: 'Your files are processed locally and never stored on our servers',
      points: ['No file uploads', 'End-to-end encryption', 'GDPR compliant'],
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-500 transition-transform group-hover:scale-110" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'Advanced Features',
      description: 'Powerful tools to handle your PDF needs',
      points: ['Page reordering', 'Rotation support', 'Preview thumbnails'],
    },
  ];

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
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Powerful PDF Tools,
              <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg mb-8">
              Easily merge, convert, and manage your PDF files in one place.
              <br />
              Secure, reliable, and completely free to use.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-500 mb-12 text-center"
          >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                <Wand2 className="w-4 h-4" />
                Our Services
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                What Can We <span className="text-primary">Help You With?</span>
              </h2>
              <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg">
                Choose from our growing list of tools to handle your PDF tasks.
              </p>
          </AnimateOnScroll>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <AnimateOnScroll
                  key={index}
                  animation="animate-in fade-in-0"
                  className="duration-700"
                  delay={index * 200}
              >
                <Link href={service.href} className="h-full block">
                  <Card className="group text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border hover:border-primary bg-card h-full flex flex-col">
                    <CardHeader className="flex-row items-center gap-4">
                      <div className={`p-3 rounded-lg ${service.bgColor}`}>
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground">{service.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
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
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Experience the <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Future of PDF Tools</span>
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Discover the most intuitive and powerful PDF tools available online. Built with cutting-edge technology for the best user experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left grid-auto-rows-fr">
                  {futureFeatures.map((feature, index) => (
                    <AnimateOnScroll
                      key={index}
                      animation="animate-in fade-in-0"
                      className="duration-700"
                      delay={index * 250}
                    >
                      <Card className="group bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary flex flex-col h-full">
                        <CardContent className="p-0 flex-grow">
                          <div className="flex flex-col items-start gap-4 h-full">
                            <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                              {feature.icon}
                            </div>
                            <div className="space-y-2 flex-grow">
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
                              <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                            <ul className="space-y-3 mt-4">
                              {feature.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="flex items-center gap-3">
                                  <CheckIcon className="w-5 h-5 text-primary" />
                                  <span className="text-muted-foreground">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimateOnScroll>
                  ))}
                </div>
            </div>
          </AnimateOnScroll>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="bg-card border rounded-2xl p-8 lg:p-10 overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-left-12"
                className="duration-700 w-full lg:w-auto"
              >
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                    <Wand2 className="w-4 h-4" />
                    Ready to get started?
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
                    Try our <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">PDF Tools now</span>
                  </h2>
                  <p className="max-w-xl text-muted-foreground text-base">
                    Start working with your PDF files now. No registration required, completely free, and secure.
                  </p>
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll
                animation="animate-in fade-in-0 slide-in-from-right-12"
                className="duration-700 w-full lg:w-auto"
              >
                <div className="flex-shrink-0">
                  <Button asChild size="lg" className="font-bold text-base w-full sm:w-auto shadow-md hover:shadow-lg hover:scale-105 transition-all group">
                    <Link href="/merger">
                      Start Merging <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
