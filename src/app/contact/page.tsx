import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Mail, MessageSquare, Phone, MapPin } from "lucide-react";
import Link from 'next/link';

const contactMethods = [
  {
    icon: <Mail className="w-8 h-8 text-blue-400" />,
    title: 'Email Us',
    description: 'Send us an email anytime',
    href: 'mailto:support@pdfusion.com',
    details: 'support@pdfusion.com',
    bgColor: 'bg-blue-900/20 hover:bg-blue-900/40',
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-green-400" />,
    title: 'Live Chat',
    description: 'Get instant help',
    href: '#',
    details: 'Available 24/7',
    bgColor: 'bg-green-900/20 hover:bg-green-900/40',
  },
  {
    icon: <Phone className="w-8 h-8 text-purple-400" />,
    title: 'Call Us',
    description: 'Speak with our team',
    href: 'tel:+15551234567',
    details: '+1 (555) 123-4567',
    bgColor: 'bg-purple-900/20 hover:bg-purple-900/40',
  },
  {
    icon: <MapPin className="w-8 h-8 text-orange-400" />,
    title: 'Office',
    description: 'Visit our headquarters',
    href: '#',
    details: 'San Francisco, CA',
    bgColor: 'bg-orange-900/20 hover:bg-orange-900/40',
  },
];

export default function ContactPage() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <AnimateOnScroll
          animation="animate-in fade-in-0 slide-in-from-bottom-12"
          className="duration-500"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Get In Touch
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Contact{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            Have a question or need help? We're here to assist you with any inquiries about our PDF merger tool.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 text-center">
          {contactMethods.map((method, index) => (
            <AnimateOnScroll
              key={index}
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-700"
              delay={150 * (index + 1)}
            >
              <Link href={method.href}>
                <Card className="group bg-card/50 dark:bg-card/20 hover:border-primary/50 transition-all duration-300 h-full p-6 border border-border/20 rounded-2xl flex flex-col items-center justify-center text-center">
                  <CardContent className="p-0 flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${method.bgColor}`}>
                      {method.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <p className="text-base font-semibold text-foreground pt-2">{method.details}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
