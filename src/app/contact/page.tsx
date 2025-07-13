
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const contactMethods = [
  {
    icon: <Mail className="w-8 h-8 text-blue-500 dark:text-blue-400" />,
    title: 'Email Us',
    description: 'Send us an email anytime',
    href: 'mailto:garvitkajot854@gmail.com',
    details: 'garvitkajot854@gmail.com',
    bgColor: 'bg-blue-100/50 dark:bg-blue-900/20 hover:bg-blue-200/60 dark:hover:bg-blue-900/40',
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-primary dark:text-primary" />,
    title: 'Live Chat',
    description: 'Get instant help',
    href: '#',
    details: 'Available 24/7',
    bgColor: 'bg-primary/10 hover:bg-primary/20',
  },
  {
    icon: <Phone className="w-8 h-8 text-purple-500 dark:text-purple-400" />,
    title: 'Call Us',
    description: 'Speak with our team',
    href: 'tel:+918306064643',
    details: '+91 8306064643',
    bgColor: 'bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-200/60 dark:hover:bg-purple-900/40',
  },
  {
    icon: <MapPin className="w-8 h-8 text-orange-500 dark:text-orange-400" />,
    title: 'Office',
    description: 'Visit our headquarters',
    href: '#',
    details: 'Ajmer, Rajasthan',
    bgColor: 'bg-orange-100/50 dark:bg-orange-900/20 hover:bg-orange-200/60 dark:hover:bg-orange-900/40',
  },
];

export default function ContactPage() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="text-center lg:text-left lg:col-span-3">
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
              <p className="max-w-2xl mx-auto lg:mx-0 text-muted-foreground text-base md:text-lg">
                Have a question or need help? We're here to assist you with any inquiries about our PDF merger tool.
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 text-left">
              {contactMethods.map((method, index) => (
                <AnimateOnScroll
                  key={index}
                  animation="animate-in fade-in-0 slide-in-from-bottom-12"
                  className="duration-700"
                  delay={150 * (index + 1)}
                >
                  <Link href={method.href}>
                    <Card className="group bg-card/50 dark:bg-card/20 hover:border-primary/50 transition-all duration-300 h-full p-6 border border-border/20 rounded-2xl flex flex-col items-start justify-center text-left hover:shadow-lg">
                      <CardContent className="p-0 flex items-start gap-4">
                        <div className={`p-3 rounded-xl transition-colors duration-300 ${method.bgColor}`}>
                          {method.icon}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{method.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{method.details}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
          
          <AnimateOnScroll
            animation="animate-in fade-in-0 slide-in-from-bottom-12"
            className="duration-700 lg:col-span-2"
            delay={300}
          >
            <Card className="p-8 sm:p-10 rounded-2xl shadow-lg border border-border/20 bg-card/50 dark:bg-card/20">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Send a Message</CardTitle>
                <CardDescription>We'll get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="first-name" className="font-medium">First Name</label>
                      <Input id="first-name" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last-name" className="font-medium">Last Name</label>
                      <Input id="last-name" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="font-medium">Email</label>
                    <Input id="email" type="email" placeholder="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="help-topic" className="font-medium">How can we help?</label>
                    <Select>
                      <SelectTrigger id="help-topic">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="font-medium">Message</label>
                    <Textarea id="message" placeholder="Type your message here..." rows={5} />
                  </div>
                  <Button type="submit" size="lg" className="w-full font-bold text-base">
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
