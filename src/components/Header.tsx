
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, Combine, Scissors, Image as ImageIcon, FileText, RotateCw, Hash, ListOrdered, Code, Pencil, LayoutGrid, Calculator, Currency, QrCode, SlidersHorizontal, LockKeyhole, ChevronRight, Droplets, Pilcrow, X, BookCheck } from 'lucide-react';
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
import InstallPWA from '@/components/InstallPWA';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { services as servicesData } from '@/lib/services';


const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="group relative pt-2 pb-1 font-semibold transition-colors text-muted-foreground hover:text-primary non-draggable"
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


const MobileNavLink = ({ href, label, currentPath, onClick, className }: { href: string; label: string; currentPath: string, onClick?: () => void, className?: string }) => {
  const isActive = href === "/" ? currentPath === href : currentPath.startsWith(href);

  return (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "group relative pb-1 text-base font-semibold transition-colors w-fit",
             isActive ? "text-primary" : "text-foreground hover:text-primary",
             className,
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
  const [isMoreToolsMenuOpen, setIsMoreToolsMenuOpen] = useState(false);
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const services = servicesData.filter(s => s.href !== '/more-tools').map(s => ({...s, label: s.title}));

  const moreTools = [
      { href: "/calculator", label: "Calculator", icon: <Calculator className="text-blue-500" /> },
      { href: "/currency-converter", label: "Currency Converter", icon: <Currency className="text-green-500" /> },
      { href: "/qr-code-generator", label: "QR Code Generator", icon: <QrCode className="text-purple-500" /> },
      { href: "/unit-converter", label: "Unit Converter", icon: <SlidersHorizontal className="text-orange-500" /> },
      { href: "/password-generator", label: "Password Generator", icon: <LockKeyhole className="text-red-500" /> },
      { href: '/markdown-to-html', label: 'Markdown to HTML', icon: <Code className="text-teal-500" /> },
      { href: '/text-summarizer', label: 'Text Summarizer', icon: <Pilcrow className="text-indigo-500" /> },
  ];
  
  const isServicesActive = services.some(s => pathname.startsWith(s.href)) || moreTools.some(s => pathname.startsWith(s.href)) || pathname.startsWith('/more-tools');

  const logoSrc = resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg';

  return (
    <motion.header 
      className="pb-4 border-b border-border/20 sticky top-0 z-50 bg-background/80 backdrop-blur-lg draggable"
      style={{ paddingTop: 'calc(env(titlebar-area-height, 0px) + 1rem)'}}
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={scrollDirection === "down" ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between md:grid md:grid-cols-3">
        {/* Mobile Left */}
        <div className="md:hidden flex items-center justify-start non-draggable">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open menu</span>
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 flex flex-col" showCloseButton={false}>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="p-6 pb-4 flex items-center justify-between border-b">
                      <Link href="/" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                          {mounted ? <Image src={logoSrc} alt="PDFusion Logo" width={32} height={32} /> : <div style={{width: 32, height: 32}} />}
                          <h1 className="text-xl font-bold tracking-tight">
                          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                              PDFusion
                          </span>
                          </h1>
                      </Link>
                  </div>
                  <ScrollArea className="flex-1">
                      <nav className="flex flex-col p-6 space-y-6">
                          <div className='flex flex-col items-start space-y-4'>
                              <MobileNavLink href="/" label="Home" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                              <MobileNavLink href="/about" label="About" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                              <MobileNavLink href="/contact" label="Contact" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                          </div>
                          
                           <div className="w-full border-t pt-6 space-y-2">
                              <div className="text-base font-semibold text-foreground">Services</div>
                              <div className="grid grid-cols-1 gap-2 pt-2">
                                  {services.map((service) => {
                                      const isActive = pathname.startsWith(service.href);
                                      return (
                                      <Link 
                                          key={service.href} 
                                          href={service.href} 
                                          onClick={() => setIsSheetOpen(false)} 
                                          className={cn(
                                              "group flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
                                              isActive && "bg-accent text-accent-foreground"
                                          )}
                                      >
                                          <div className="h-5 w-5 flex items-center justify-center mr-3 shrink-0">
                                              {React.cloneElement(service.icon, { className: cn("w-5 h-5", service.icon.props.className) })}
                                          </div>
                                          <span className="text-sm font-medium">{service.label}</span>
                                      </Link>
                                  )})}
                              </div>
                          </div>
                          <div className="w-full border-t pt-6 space-y-2">
                                <MobileNavLink href="/more-tools" label="More Tools" currentPath={pathname} onClick={() => setIsSheetOpen(false)} />
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                  {moreTools.map((tool) => {
                                      const isActive = pathname.startsWith(tool.href);
                                      return (
                                      <Link 
                                          key={tool.href} 
                                          href={tool.href} 
                                          onClick={() => setIsSheetOpen(false)} 
                                          className={cn(
                                              "group flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
                                              isActive && "bg-accent text-accent-foreground"
                                          )}
                                      >
                                          <div className="h-5 w-5 flex items-center justify-center mr-3 shrink-0">
                                              {React.cloneElement(tool.icon, { className: cn("w-5 h-5", tool.icon.props.className) })}
                                          </div>
                                          <span className="text-sm font-medium">{tool.label}</span>
                                      </Link>
                                  )})}
                              </div>
                          </div>
                      </nav>
                  </ScrollArea>
                  <div className="p-6 mt-auto border-t">
                      <InstallPWA inSheet={true} />
                  </div>
              </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo & Nav */}
        <div className="hidden md:flex items-center gap-4 non-draggable">
            <Link href="/" className="flex items-center gap-2">
              {mounted ? <Image src={logoSrc} alt="PDFusion Logo" width={32} height={32} /> : <div style={{width: 32, height: 32}} />}
              <h1 className="text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  PDFusion
                  </span>
              </h1>
            </Link>
        </div>
        
        {/* Mobile Center (Logo) */}
         <div className="md:hidden flex items-center justify-center non-draggable">
             <Link href="/" className="flex items-center gap-2">
              {mounted ? <Image src={logoSrc} alt="PDFusion Logo" width={32} height={32} /> : <div style={{width: 32, height: 32}} />}
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
              className="relative non-draggable"
              onHoverStart={() => setIsServicesMenuOpen(true)}
              onHoverEnd={() => {
                setIsServicesMenuOpen(false);
                setIsMoreToolsMenuOpen(false);
              }}
            >
              <div
                className="group relative pt-2 pb-1 font-semibold transition-colors text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1"
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
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex"
                  >
                    <div className="bg-popover p-2 rounded-lg border text-popover-foreground shadow-lg grid grid-cols-2 gap-1 w-[500px]">
                      {services.map((service) => {
                        const isActive = pathname.startsWith(service.href);
                        return (
                        <Link
                          href={service.href}
                          key={service.href}
                          className={cn(
                            "group w-full flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                            isActive && "bg-accent text-accent-foreground"
                          )}
                           onMouseEnter={() => setIsMoreToolsMenuOpen(false)}
                        >
                          <div className="flex h-5 w-5 items-center justify-center mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110">
                            {React.cloneElement(service.icon, { className: cn("w-5 h-5", service.icon.props.className) })}
                          </div>
                          <span className="text-sm font-medium">{service.label}</span>
                        </Link>
                        )
                      })}
                       <Link
                          href="/more-tools"
                          className={cn(
                            "group col-span-2 w-full flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                            pathname.startsWith('/more-tools') && "bg-accent text-accent-foreground"
                          )}
                          onMouseEnter={() => setIsMoreToolsMenuOpen(true)}
                        >
                          <div className="flex h-5 w-5 items-center justify-center mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110 text-gray-500">
                           <LayoutGrid />
                          </div>
                          <span className="text-sm font-medium">More Tools</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </Link>
                    </div>

                     <AnimatePresence>
                      {isMoreToolsMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-0 left-full ml-2 bg-popover p-2 rounded-lg border text-popover-foreground shadow-lg grid grid-cols-1 gap-1 w-max"
                           onMouseLeave={() => setIsMoreToolsMenuOpen(false)}
                        >
                          {moreTools.map((tool) => {
                            const isActive = pathname.startsWith(tool.href);
                            return (
                              <Link
                                href={tool.href}
                                key={tool.href}
                                className={cn(
                                  "group w-full flex items-center p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                  isActive && "bg-accent text-accent-foreground"
                                )}
                              >
                               <div className="flex h-5 w-5 items-center justify-center mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110">
                                {React.cloneElement(tool.icon, { className: cn("w-5 h-5", tool.icon.props.className) })}
                               </div>
                                <span className="text-sm font-medium">{tool.label}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
        </nav>

        {/* Right side controls (Desktop & Mobile) */}
        <div className="flex items-center gap-2 justify-end non-draggable">
            <InstallPWA />
            <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
