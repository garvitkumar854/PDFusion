
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggler } from './ThemeToggler';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const services = [
    { href: "/merger", label: "Merge PDF", icon: <Layers className="mr-2 h-4 w-4" /> },
    { href: "/word-to-pdf", label: "Word to PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
]

const NavLink = ({ href, label, currentPath, onClick }: { href: string; label: string; currentPath: string, onClick?: () => void }) => {
  const isActive = href === "/" ? currentPath === href : currentPath.startsWith(href);

  return (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "group relative py-2 font-semibold transition-colors",
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
          <h1 className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              PDFusion
            </span>
          </h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href + link.label} href={link.href} label={link.label} currentPath={pathname} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-primary p-2 group">
                Services
                <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {services.map((service) => (
                    <DropdownMenuItem key={service.href} asChild>
                        <Link href={service.href}>
                            {service.icon}
                            {service.label}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggler />
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
                <SheetContent side="top" className="h-auto p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <div className="bg-primary p-2 rounded-md">
                                    <Layers className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">
                                  <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                                    PDFusion
                                  </span>
                                </h1>
                            </Link>
                        </div>
                        <nav className="flex flex-col gap-6 items-start px-2 mb-6">
                             {navLinks.map((link) => (
                                <MobileNavLink 
                                  key={link.href + link.label} 
                                  href={link.href} 
                                  label={link.label} 
                                  currentPath={pathname} 
                                  onClick={() => setIsOpen(false)} 
                                />
                            ))}
                            <div className="text-lg font-semibold text-foreground">Services</div>
                            {services.map((service) => (
                                <Link key={service.href} href={service.href} onClick={() => setIsOpen(false)} className="flex items-center text-muted-foreground hover:text-primary transition-colors ml-4">
                                     {service.icon}
                                    {service.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-auto pt-6 border-t flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">Switch Theme</span>
                              <ThemeToggler />
                            </div>
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
