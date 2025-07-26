
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const SunIcon = () => <Sun className="h-4 w-4 text-yellow-500" />;
const MoonIcon = () => <Moon className="h-4 w-4 text-sky-400" />;

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
    return <div className="w-12 h-6 rounded-full bg-muted" />; // Skeleton loader
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center h-6 w-12 rounded-full cursor-pointer transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isLight ? "bg-primary justify-start" : "bg-gray-800 justify-end"
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className="h-5 w-5 bg-white rounded-full shadow-md flex items-center justify-center mx-0.5"
      >
        <AnimatePresence initial={false} mode="wait">
          {isLight ? (
            <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
              <SunIcon />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
              <MoonIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  )
}
