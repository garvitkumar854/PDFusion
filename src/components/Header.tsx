
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, Combine, Scissors, FileArchive, Image as ImageIcon, FileText, RotateCw, Hash, ListOrdered, Code } from 'lucide-react';
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
import InstallPWA from './InstallPWA';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="group relative py-2 font-semibold transition-colors text-muted-foreground hover:text-primary"
    >
      <span className={cn(isActive && "text-primary")}>{children}</span>
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
            "group relative py-1 text-lg font-semibold transition-colors w-fit",
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

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const pathname = usePathname();
  const services = [
      { href: "/merger", label: "Merge PDF", icon: <Combine className="mr-2 h-4 w-4" /> },
      { href: "/split-pdf", label: "Split PDF", icon: <Scissors className="mr-2 h-4 w-4" /> },
      { href: "/compress-pdf", label: "Compress PDF", icon: <FileArchive className="mr-2 h-4 w-4" /> },
      { href: "/organize-pdf", label: "Organize PDF", icon: <ListOrdered className="mr-2 h-4 w-4" /> },
      { href: "/pdf-to-jpg", label: "PDF to JPG", icon: <ImageIcon className="mr-2 h-4 w-4" /> },
      { href: "/jpg-to-pdf", label: "JPG to PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
      { href: "/pdf-to-html", label: "PDF to HTML", icon: <Code className="mr-2 h-4 w-4" /> },
      { href: "/html-to-pdf", label: "HTML to PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
      { href: "/rotate-pdf", label: "Rotate PDF", icon: <RotateCw className="mr-2 h-4 w-4" /> },
      { href: "/add-page-numbers", label: "Add Page Numbers", icon: <Hash className="mr-2 h-4 w-4" /> },
  ]
  const isServicesActive = services.some(s => pathname.startsWith(s.href));

  return (
    <header className="py-4 border-b border-border/20 sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 flex justify-between items-center gap-4">
        <div className="flex-shrink-0 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PDFusion Logo" width={32} height={32} />
            <h1 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                PDFusion
                </span>
            </h1>
            </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 justify-center">
            <NavLink href="/">Home</NavLink>
            <DropdownMenu open={isServicesMenuOpen} onOpenChange={setIsServicesMenuOpen}>
              <div onMouseEnter={() => setIsServicesMenuOpen(true)} onMouseLeave={() => setIsServicesMenuOpen(false)}>
                <DropdownMenuTrigger asChild>
                   <div className="group relative py-2 font-semibold transition-colors text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
                      <span className={cn(isServicesActive && "text-primary")}>Services</span>
                      <motion.div
                          animate={{ rotate: isServicesMenuOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ originX: 0.5, originY: 0.5 }}
                      >
                         <ChevronDown className="h-4 w-4" />
                      </motion.div>
                      <span
                        className={cn(
                          "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300",
                          isServicesMenuOpen || isServicesActive ? "w-full" : "w-0 group-hover:w-full"
                        )}
                      />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="mt-2"
                  onMouseLeave={() => setIsServicesMenuOpen(false)}
                >
                    {services.map((service) => (
                        <DropdownMenuItem key={service.href} asChild>
                            <Link href={service.href} className="flex items-center">
                                {service.icon}
                                {service.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
        </nav>

        <div className="flex-shrink-0 flex items-center gap-2">
            <InstallPWA />
            <ThemeToggle />
            <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                                <Link href="/" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                                    <Image src="/logo.svg" alt="PDFusion Logo" width={32} height={32} />
                                    <h1 className="text-xl font-bold tracking-tight">
                                    <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                                        PDFusion
                                    </span>
                                    </h1>
                                </Link>
                            </div>
                            <nav className="flex flex-col gap-1 items-start px-2 mb-6">
                                <MobileNavLink href="/" label="Home" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                <MobileNavLink href="/about" label="About" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                <MobileNavLink href="/contact" label="Contact" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                <div className="text-lg font-semibold text-foreground pt-3">Services</div>
                                {services.map((service) => (
                                    <Link key={service.href} href={service.href} onClick={() => setIsSheetOpen(false)} className="flex items-center text-muted-foreground hover:text-primary transition-colors ml-4 py-1.5">
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
