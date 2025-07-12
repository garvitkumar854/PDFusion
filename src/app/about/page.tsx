import AnimateOnScroll from "@/components/AnimateOnScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users } from "lucide-react";
import Image from "next/image";

const teamMembers = [
  {
    name: "John Doe",
    role: "Lead Developer",
    avatar: "https://placehold.co/100x100.png",
    hint: "man portrait"
  },
  {
    name: "Jane Smith",
    role: "UI/UX Designer",
    avatar: "https://placehold.co/100x100.png",
    hint: "woman portrait"
  },
  {
    name: "Peter Jones",
    role: "Project Manager",
    avatar: "https://placehold.co/100x100.png",
    hint: "man portrait glasses"
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
                  <Users className="w-4 h-4" />
                  Our Team
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Meet the Innovators
                </h2>
                <p className="max-w-3xl mx-auto text-muted-foreground text-base md:text-lg mb-12">
                  We are a passionate team of developers and designers dedicated to creating the best PDF tools.
                </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
                {teamMembers.map((member, index) => (
                    <AnimateOnScroll
                    key={index}
                    animation="animate-in fade-in-0 slide-in-from-bottom-12"
                    className="duration-700"
                    delay={index * 150}
                    >
                    <Card className="group bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border p-6 rounded-xl hover:border-primary flex flex-col items-center">
                        <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20 group-hover:border-primary transition-colors">
                            <Image src={member.avatar} alt={member.name} width={100} height={100} data-ai-hint={member.hint} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
                        <p className="text-primary font-medium">{member.role}</p>
                    </Card>
                    </AnimateOnScroll>
                ))}
            </div>
        </div>
      </section>
    </>
  );
}
