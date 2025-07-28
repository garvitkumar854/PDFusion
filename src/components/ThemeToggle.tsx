
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 30,
};

const Sparkle = ({ className }: { className?: string }) => (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5 0L6.12257 3.87743L10 5L6.12257 6.12257L5 10L3.87743 6.12257L0 5L3.87743 3.87743L5 0Z" fill="currentColor"/>
    </svg>
);


export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!isMounted) {
    return <div className="w-16 h-8 rounded-full bg-muted" />; // Skeleton loader
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-8 w-16 items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isLight ? "bg-primary" : "bg-gray-800"
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
        <motion.div
          className="absolute left-1.5 z-10"
          animate={{
            color: isLight ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground))',
          }}
          transition={spring}
        >
            <Sun className="h-5 w-5" />
        </motion.div>
         <motion.div
          className="absolute right-1.5 z-10"
           animate={{
            color: !isLight ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground))',
          }}
          transition={spring}
        >
            <Moon className="h-5 w-5" />
             <AnimatePresence>
                {!isLight && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute -top-1 -right-1"
                      >
                       <Sparkle className="w-2.5 h-2.5" />
                    </motion.div>
                )}
            </AnimatePresence>
             <AnimatePresence>
                {!isLight && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                        className="absolute top-0.5 -left-1"
                      >
                       <Sparkle className="w-2 h-2" />
                    </motion.div>
                )}
            </AnimatePresence>
             <AnimatePresence>
                {!isLight && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
                        className="absolute -bottom-1 right-0"
                      >
                       <Sparkle className="w-1.5 h-1.5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      <motion.div
        className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md"
        layout
        transition={spring}
        style={{ right: isLight ? 'auto' : '0.25rem', left: isLight ? '0.25rem' : 'auto' }}
      />
    </button>
  )
}
