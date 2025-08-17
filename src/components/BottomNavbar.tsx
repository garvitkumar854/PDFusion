
"use client";

import { Home, LayoutGrid, Info, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#services', label: 'Tools', icon: LayoutGrid },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
];

const BottomNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t border-border/20 z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href.split('#')[0]);
          const Icon = item.icon;

          return (
            <Link href={item.href} key={item.label} className="flex-1 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors relative h-full">
              <motion.div
                className="relative flex items-center justify-center"
                animate={{ y: isActive ? -18 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div
                  className={cn(
                    "absolute -inset-2.5 rounded-full transition-all",
                    isActive && "bg-primary/10"
                  )}
                />
                 <Icon
                  className={cn(
                    "w-6 h-6 z-10 transition-colors",
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              </motion.div>
              <span className={cn("transition-opacity", isActive ? 'opacity-100 font-semibold text-primary' : 'opacity-100')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
