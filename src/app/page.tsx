import { ArrowRight, FilePlus2, Wand2, Download, Zap, ShieldCheck, FileText, Lock, Globe, Smartphone, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CheckIcon from '@/components/CheckIcon';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export default function Home() {
  const features = [
    {
      icon: <FilePlus2 className="w-6 h-6 text-blue-600" />,
      title: 'Upload PDFs',
      description: 'Drag and drop multiple PDF files',
      bgColor: 'bg-blue-100',
    },
    {
      icon: <Wand2 className="w-6 h-6 text-purple-600" />,
      title: 'Merge & Edit',
      description: 'Combine, reorder, and edit pages',
      bgColor: 'bg-purple-100',
    },
    {
      icon: <Download className="w-6 h-6 text-green-600" />,
      title: 'Download',
      description: 'Get your merged PDF instantly',
      bgColor: 'bg-green-100',
    },
  ];

  const advancedFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-red-500" />,
      bgColor: 'bg-red-100',
      title: 'Privacy First',
      description: 'Your documents never leave your device. Complete privacy and security guaranteed.',
    },
    {
      icon: <Globe className="w-6 h-6 text-purple-500" />,
      bgColor: 'bg-purple-100',
      title: 'Works Everywhere',
      description: 'Access from any device, anywhere. No downloads or installations required.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-blue-500" />,
      bgColor: 'bg-blue-100',
      title: 'Mobile Friendly',
      description: 'Optimized for touch devices. Perfect for on-the-go PDF management.',
    },
  ];

  const futureFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      bgColor: 'bg-yellow-100',
      title: 'Lightning Fast',
      description: 'Merge your PDFs in seconds with our optimized processing engine',
      points: ['Client-side processing', 'Instant preview', 'Quick downloads'],
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      bgColor: 'bg-green-100',
      title: 'Secure & Private',
      description: 'Your files are processed locally and never stored on our servers',
      points: ['No file uploads', 'End-to-end encryption', 'GDPR compliant'],
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      bgColor: 'bg-blue-100',
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
              ✨ The Ultimate PDF Merger
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
              Merge PDFs with{' '}
              <br />
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Ease</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1 10.3c15.2-4.1 31.4-6.3 47.7-6.3 16.3 0 32.5 2.2 47.7 6.3"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg mb-8">
              Combine multiple PDF files into one document quickly and securely.
              <br />
              No file size limits, no watermarks, completely free.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-700 delay-300"
          >
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg" className="font-bold rounded-[30px] hover:scale-105 hover:shadow-lg transition-all w-full sm:w-auto">
                <Link href="/merger" className="group">
                  Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold text-foreground bg-transparent hover:bg-[#E9EFFD] rounded-[30px] hover:scale-105 hover:shadow-md transition-all hover:text-primary w-full sm:w-auto">
                <Link href="#">Learn more</Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimateOnScroll
                  key={index}
                  animation="animate-in fade-in-0"
                  className="duration-700"
                  style={{ animationDelay: `${index * 150}ms` }}
              >
                <Card className="group text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border hover:border-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-start gap-4">
                      <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
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
                animation="animate-in fade-in-0 slide-in-from-bottom-12"
                className="duration-700"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                  <Wand2 className="w-4 h-4" />
                  More Than Just Merging
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Everything You Need for <span className="text-primary">PDF Management</span>
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Our comprehensive toolset goes beyond simple merging to provide a complete PDF solution.
                </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {advancedFeatures.map((feature, index) => (
                    <AnimateOnScroll
                    key={index}
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-700"
                    delay={index * 150}
                    >
                    <Card className="group bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary">
                        <CardContent className="p-0">
                        <div className="flex flex-col items-start gap-4">
                            <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                            {feature.icon}
                            </div>
                            <div className="space-y-2">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
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
         <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-700"
          >
            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                  <Wand2 className="w-4 h-4" />
                  Why Choose Our PDF Merger?
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Experience the <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Future of PDF Merging</span>
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  Discover the most intuitive and powerful PDF merging tool available online. Built with cutting-edge technology for the best user experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  {futureFeatures.map((feature, index) => (
                    <AnimateOnScroll
                      key={index}
                      animation="animate-in fade-in-0 slide-in-from-bottom-12"
                      className="duration-700"
                      delay={index * 150}
                    >
                      <Card className="group bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary">
                        <CardContent className="p-0">
                          <div className="flex flex-col items-start gap-4">
                            <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                              {feature.icon}
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary">{feature.title}</h3>
                              <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                            <ul className="space-y-3 mt-2">
                              {feature.points.map(point => (
                                <li key={point} className="flex items-center gap-3">
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
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-700"
          >
            <div className="bg-card border rounded-2xl p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
                    <Wand2 className="w-4 h-4" />
                    Ready to get started?
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
                    Ready to merge your <span className="text-primary">PDFs?</span>
                  </h2>
                  <p className="max-w-xl text-muted-foreground text-base">
                    Start combining your PDF files now with our easy-to-use tool. No registration required, completely free, and secure.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button asChild size="lg" className="font-bold text-base w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
                    <Link href="/merger" className="group">
                      Start Merging <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

    </>
  );
}
