
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, Combine, Scissors, FileArchive, Image as ImageIcon, FileText, RotateCw, Hash, ListOrdered, Code, Edit, Lock, Unlock } from 'lucide-react';
import Image from 'next/image';
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
import InstallPWA from './InstallPWA';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const services = [
    { href: "/merger", label: "Merge PDF", icon: <Combine className="mr-2 h-4 w-4" /> },
    { href: "/split-pdf", label: "Split PDF", icon: <Scissors className="mr-2 h-4 w-4" /> },
    { href: "/organize-pdf", label: "Organize PDF", icon: <ListOrdered className="mr-2 h-4 w-4" /> },
    { href: "/pdf-to-jpg", label: "PDF to JPG", icon: <ImageIcon className="mr-2 h-4 w-4" /> },
    { href: "/jpg-to-pdf", label: "JPG to PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
    { href: "/pdf-to-html", label: "PDF to HTML", icon: <Code className="mr-2 h-4 w-4" /> },
    { href: "/html-to-pdf", label: "HTML to PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
    { href: "/rotate-pdf", label: "Rotate PDF", icon: <RotateCw className="mr-2 h-4 w-4" /> },
    { href: "/add-page-numbers", label: "Add Page Numbers", icon: <Hash className="mr-2 h-4 w-4" /> },
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
            "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 transition-all duration-300",
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
            "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 transition-all duration-300",
            isActive ? "w-full" : "w-0 group-hover:w-full"
            )}
        />
    </Link>
  );
};

const PdfFusionLogo = ({ className }: { className?: string }) => (
  <Image
    src="/icon.svg"
    alt="PDFusion Logo"
    width={32}
    height={32}
    className={cn("w-8 h-8", className)}
  />
);


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isServicesActive = services.some(s => pathname.startsWith(s.href));

  return (
    <header className="py-4 border-b bg-background/80 sticky top-0 z-50 backdrop-blur-lg">
      <div className="container mx-auto px-4 flex justify-between items-center gap-4">
        <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
            <PdfFusionLogo />
            <h1 className="text-xl font-bold tracking-tight sm:block">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                PDFusion
                </span>
            </h1>
            </Link>
        </div>
        
        <nav className="hidden md:flex flex-1 items-center gap-8 justify-center">
          <NavLink href="/" label="Home" currentPath={pathname} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn(
                    "group relative py-2 font-semibold transition-colors flex items-center cursor-pointer",
                    isServicesActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}>
                    <span>Services</span>
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    <span
                        className={cn(
                        "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 transition-all duration-300",
                        isServicesActive ? "w-full" : "w-0 group-hover:w-full"
                        )}
                    />
                </div>
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
          <NavLink href="/about" label="About" currentPath={pathname} />
          <NavLink href="/contact" label="Contact" currentPath={pathname} />
        </nav>

        <div className="flex-shrink-0 flex items-center gap-2">
            <InstallPWA />
            <ThemeToggler />
            <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="top" className="h-auto p-0">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                    <PdfFusionLogo />
                                    <h1 className="text-xl font-bold tracking-tight">
                                    <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                                        PDFusion
                                    </span>
                                    </h1>
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-3 items-start px-2 mb-6">
                                {navLinks.map((link) => (
                                    <MobileNavLink 
                                    key={link.href + link.label} 
                                    href={link.href} 
                                    label={link.label} 
                                    currentPath={pathname} 
                                    onClick={() => setIsOpen(false)} 
                                    />
                                ))}
                                <div className="text-lg font-semibold text-foreground pt-2">Services</div>
                                {services.map((service) => (
                                    <Link key={service.href} href={service.href} onClick={() => setIsOpen(false)} className="flex items-center text-muted-foreground hover:text-primary transition-colors ml-4 py-1">
                                        {service.icon}
                                        {service.label}
                                    </Link>
                                ))}
                                 <div className="pt-4 w-full">
                                    <InstallPWA inSheet={true} />
                                </div>
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
