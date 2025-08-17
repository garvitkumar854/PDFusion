
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, Combine, Scissors, FileArchive, Image as ImageIcon, FileText, RotateCw, Hash, ListOrdered, Code, Pencil } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

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
            "group relative py-2 text-base font-semibold transition-colors w-fit",
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
  const scrollDirection = useScrollDirection();
  
  const services = [
      { href: "/merger", label: "Merge PDF", icon: <Combine /> },
      { href: "/split-pdf", label: "Split PDF", icon: <Scissors /> },
      { href: "/organize-pdf", label: "Organize PDF", icon: <ListOrdered /> },
      { href: "/pdf-to-jpg", label: "PDF to JPG", icon: <ImageIcon /> },
      { href: "/jpg-to-pdf", label: "JPG to PDF", icon: <FileText /> },
      { href: "/pdf-to-html", label: "PDF to HTML", icon: <Code /> },
      { href: "/html-to-pdf", label: "HTML to PDF", icon: <FileText /> },
      { href: "/rotate-pdf", label: "Rotate PDF", icon: <RotateCw /> },
      { href: "/add-page-numbers", label: "Add Page Numbers", icon: <Hash /> },
  ]
  const isServicesActive = services.some(s => pathname.startsWith(s.href));

  return (
    <motion.header 
      className="py-4 border-b border-border/20 sticky top-0 z-50 bg-background/80 backdrop-blur-lg"
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={scrollDirection === "down" ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
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
            <motion.div
              className="relative"
              onHoverStart={() => setIsServicesMenuOpen(true)}
              onHoverEnd={() => setIsServicesMenuOpen(false)}
            >
              <div
                className="group relative py-2 font-semibold transition-colors text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1"
              >
                <span className={cn(isServicesActive && "text-primary")}>Services</span>
                <motion.div
                  animate={{ rotate: isServicesMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center justify-center"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300",
                    (isServicesMenuOpen || isServicesActive) ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </div>

              <AnimatePresence>
                {isServicesMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-auto"
                  >
                    <div className="bg-popover p-4 rounded-lg border text-popover-foreground shadow-lg grid grid-cols-2 gap-2 w-max">
                      {services.map((service) => (
                        <Link
                          href={service.href}
                          key={service.href}
                          className="group flex items-center p-3 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                        >
                          {React.cloneElement(service.icon, { className: 'mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110' })}
                          <span className="text-sm font-medium whitespace-nowrap">{service.label}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
                            <nav className="flex flex-col gap-3 items-start px-2 mb-6">
                                <div className="flex flex-col gap-1 items-start w-full">
                                    <MobileNavLink href="/" label="Home" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                    <MobileNavLink href="/about" label="About" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                    <MobileNavLink href="/contact" label="Contact" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                                
                                    <div className="w-full pt-2">
                                        <div className="text-base font-semibold text-foreground mb-2">Services</div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {services.map((service) => (
                                                <Link 
                                                    key={service.href} 
                                                    href={service.href} 
                                                    onClick={() => setIsSheetOpen(false)} 
                                                    className="group flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    {React.cloneElement(service.icon, { className: 'mr-2 h-5 w-5' })}
                                                    <span className="text-xs font-medium whitespace-nowrap">{service.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>

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
    </motion.header>
  );
}
