
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/merger", label: "Merge PDF" },
  { href: "#", label: "About" },
  { href: "#", label: "Contact" },
];

const NavLink = ({ href, label, currentPath, onClick }: { href: string; label: string; currentPath: string, onClick?: () => void }) => {
  const isActive = href === "/" ? currentPath === href : currentPath.startsWith(href);

  return (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "group relative py-2 text-sm font-semibold transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
        >
        <span>{label}</span>
        <span
            className={cn(
            "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300",
            isActive ? "w-full" : "w-0 group-hover:w-full"
            )}
        />
    </Link>
  );
};

const MobileNavLink = ({ href, label, currentPath, onClick }: { href: string; label: string; currentPath: string, onClick?: () => void }) => {
  const isActive = href === "/" ? currentPath === href : currentPath.startsWith(href);

  return (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "group relative py-2 text-lg font-semibold transition-colors w-fit",
             isActive ? "text-primary" : "text-foreground hover:text-primary"
        )}
        >
        <span>{label}</span>
         <span
            className={cn(
            "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300",
            isActive ? "w-full" : "w-0 group-hover:w-full"
            )}
        />
    </Link>
  );
};


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="py-4 border-b bg-background/80 sticky top-0 z-50 backdrop-blur-lg">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-md">
            <Layers className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PDFusion</h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href + link.label} href={link.href} label={link.label} currentPath={pathname} />
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" className="transition-colors">Sign In</Button>
          <Button className="transition-colors">Sign Up</Button>
        </div>

        <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-8">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <div className="bg-primary p-2 rounded-md">
                                    <Layers className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">PDFusion</h1>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close menu</span>
                            </Button>
                        </div>
                        <nav className="flex flex-col gap-6 items-start px-2">
                             {navLinks.map((link) => (
                                <MobileNavLink 
                                  key={link.href + link.label} 
                                  href={link.href} 
                                  label={link.label} 
                                  currentPath={pathname} 
                                  onClick={() => setIsOpen(false)} 
                                />
                            ))}
                        </nav>
                        <div className="mt-auto pt-6 border-t flex flex-col gap-4">
                            <Button variant="ghost" size="lg" className="w-full justify-center text-lg">Sign In</Button>
                            <Button size="lg" className="w-full justify-center text-lg">Sign Up</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
