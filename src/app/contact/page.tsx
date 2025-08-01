
'use client';

import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Mail, MessageSquare, Phone, MapPin, Send, Github } from "lucide-react";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

const contactMethods = [
  {
    icon: <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 dark:text-blue-400" />,
    title: 'Email Us',
    description: 'Send us an email anytime',
    href: 'mailto:garvitkajot854@gmail.com',
    details: 'garvitkajot854@gmail.com',
    bgColor: 'bg-blue-100/50 dark:bg-blue-900/20 hover:bg-blue-200/60 dark:hover:bg-blue-900/40',
  },
  {
    icon: <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 dark:text-purple-400" />,
    title: 'Call Us',
    description: 'Speak with our team',
    href: 'tel:+918306064643',
    details: '+91 8306064643',
    bgColor: 'bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-200/60 dark:hover:bg-purple-900/40',
  },
  {
    icon: <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 dark:text-orange-400" />,
    title: 'Office',
    description: 'Visit our headquarters',
    href: '#',
    details: 'Ajmer, Rajasthan',
    bgColor: 'bg-orange-100/50 dark:bg-orange-900/20 hover:bg-orange-200/60 dark:hover:bg-orange-900/40',
  },
  {
    icon: <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400" />,
    title: 'Live Chat',
    description: 'Chat with our support team',
    href: '#',
    details: 'Available 24/7',
    bgColor: 'bg-green-100/50 dark:bg-green-900/20 hover:bg-green-200/60 dark:hover:bg-green-900/40',
  }
];

const formSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name must not exceed 50 characters.")
    .regex(/^[A-Za-z\s]+$/, "First name can only contain letters and spaces."),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name must not exceed 50 characters.")
    .regex(/^[A-Za-z\s]+$/, "Last name can only contain letters and spaces."),
  email: z.string().email("Please enter a valid email address."),
  topic: z.string().min(1, "Please select a topic."),
  message: z.string().min(20, "Message must be at least 20 characters."),
});

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <defs>
        <radialGradient id="grad-instagram" cx="0.3" cy="1" r="1">
            <stop offset="0" stopColor="#FEDA77" />
            <stop offset="0.1" stopColor="#F58529" />
            <stop offset="0.25" stopColor="#DD2A7B" />
            <stop offset="0.5" stopColor="#8134AF" />
            <stop offset="1" stopColor="#515BD4" />
        </radialGradient>
        </defs>
        <path
            fill="url(#grad-instagram)"
            d="M256,0C114.615,0,0,114.615,0,256s114.615,256,256,256s256-114.615,256-256S397.385,0,256,0z M372,176   c0,11.046-8.954,20-20,20h-12c-11.046,0-20-8.954-20-20v-12c0-11.046,8.954-20,20-20h12c11.046,0,20,8.954,20,20V176z    M256,180c-75.094,0-136,60.906-136,136s60.906,136,136,136s136-60.906,136-136S331.094,180,256,180z M256,388   c-46.398,0-84-37.602-84-84s37.602-84,84-84s84,37.602,84,84S302.398,388,256,388z"
        />
    </svg>
);


export default function ContactPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      topic: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const recipient = 'garvitkajot854@gmail.com';
    const subject = `PDFusion Inquiry: ${values.topic}`;
    const body = `
Name: ${values.firstName} ${values.lastName}
Email: ${values.email}
Topic: ${values.topic}

Message:
${values.message}
    `;

    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

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
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
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
                    <Card className="group bg-transparent backdrop-blur-lg hover:border-primary/50 transition-all duration-300 h-full p-4 sm:p-6 border border-border/20 rounded-2xl flex flex-col items-start justify-center text-left hover:shadow-lg">
                      <CardContent className="p-0 flex items-start gap-4">
                        <div className={`p-2 sm:p-3 rounded-xl transition-colors duration-300 ${method.bgColor}`}>
                          {method.icon}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors">{method.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{method.details}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>

            <AnimateOnScroll
              animation="animate-in fade-in-0 slide-in-from-bottom-12"
              className="duration-700 mt-12 text-left"
              delay={150 * (contactMethods.length + 1)}
            >
                <h3 className="font-bold text-lg mb-4 text-center sm:text-left">Follow us on</h3>
                <div className="flex gap-4 items-center justify-center sm:justify-start">
                    <Link href="https://instagram.com/its_garvit__854_" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                       <div className="group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
                           <InstagramIcon className="w-12 h-12" />
                       </div>
                    </Link>
                    <Link href="https://github.com/garvitkumar854" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                       <div className="group w-12 h-12 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110">
                           <Github className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                       </div>
                    </Link>
                </div>
            </AnimateOnScroll>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-8 sm:p-10 rounded-2xl shadow-lg bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border/20">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Send a Message</CardTitle>
                <CardDescription>We'll get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How can we help?</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                              <SelectItem value="Technical Support">Technical Support</SelectItem>
                              <SelectItem value="Feedback & Suggestions">Feedback & Suggestions</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Type your message here..." rows={5} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="lg" className="w-full font-bold text-base">
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
