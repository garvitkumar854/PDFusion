import { ArrowRight, FilePlus2, Wand2, Download, Zap, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CheckIcon from '@/components/CheckIcon';

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
          <div className="inline-block bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
            ✨ The Ultimate PDF Merger
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4">
            Merge PDFs with{' '}
            <span className="relative inline-block">
              <span className="relative text-primary">Ease</span>
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
          <p className="max-w-2xl mx-auto text-muted-foreground md:text-lg mb-8">
            Combine multiple PDF files into one document quickly and securely.
            <br />
            No file size limits, no watermarks, completely free.
          </p>
          <div className="flex justify-center items-center gap-4">
            <Button asChild size="lg" className="font-bold rounded-[30px] hover:scale-105 hover:shadow-lg transition-all">
              <Link href="/merger">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold text-foreground bg-transparent hover:bg-[#E9EFFD] rounded-[30px] hover:scale-105 hover:shadow-lg transition-all hover:text-primary">
              <Link href="#">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-[0.5px] hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex flex-col items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      {feature.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
              <Wand2 className="w-4 h-4" />
              Why Choose Our PDF Merger?
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Experience the <span className="text-primary">Future of PDF Merging</span>
            </h2>
            <p className="max-w-3xl mx-auto text-muted-foreground md:text-lg mb-12">
              Discover the most intuitive and powerful PDF merging tool available online. Built with cutting-edge technology for the best user experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {futureFeatures.map((feature, index) => (
                <Card key={index} className="bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 p-6 rounded-xl hover:border-[0.5px] hover:border-primary">
                  <CardContent className="p-0">
                    <div className="flex flex-col items-start gap-4">
                      <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                        {feature.icon}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
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
              ))}
            </div>
        </div>
      </section>

    </>
  );
}
