
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

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
        <motion.span
          className="absolute left-1.5 z-10"
          animate={{
            color: isLight ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            scale: isLight ? 1 : 0.8,
            rotate: isLight ? 0 : -90
          }}
          transition={spring}
        >
            <Sun className="h-5 w-5" />
        </motion.span>
         <motion.span
          className="absolute right-1.5 z-10"
          animate={{
            color: !isLight ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            scale: !isLight ? 1 : 0.8,
            rotate: !isLight ? 0 : 90
          }}
          transition={spring}
        >
            <Moon className="h-5 w-5" />
        </motion.span>
      <motion.div
        className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md"
        layout
        transition={spring}
        style={{ right: isLight ? 'auto' : '0.25rem', left: isLight ? '0.25rem' : 'auto' }}
      />
    </button>
  )
}
