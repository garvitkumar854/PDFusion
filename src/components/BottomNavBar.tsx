
"use client";

import { Home, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/', label: 'Home', icon: <Home className="h-6 w-6" /> },
    { href: '/#services', label: 'Tools', icon: <LayoutGrid className="h-6 w-6" /> },
    { href: '/more-tools', label: 'More', icon: <SlidersHorizontal className="h-6 w-6" /> },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border/20 z-50">
      <div className="container mx-auto h-full px-4">
        <div className="grid h-full grid-cols-3">
          {navItems.map((item) => {
            const isActive = item.href === '/#services' 
                ? pathname.startsWith('/merger') || pathname.startsWith('/split-pdf') // Add other tool paths here
                : pathname === item.href;
                
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-xs relative">
                <div className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                    "transition-colors",
                    isActive ? "font-bold text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isActive && (
                    <motion.div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                        layoutId="active-indicator"
                    />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  );
}
