"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

const SunIcon = () => <Sun className="h-5 w-5 text-yellow-500" />;
const MoonIcon = () => <Moon className="h-5 w-5 text-slate-300" />;

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
        "relative flex items-center h-8 w-16 rounded-full cursor-pointer transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isLight ? "bg-blue-400" : "bg-gray-800"
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className="absolute h-7 w-7 bg-white rounded-full shadow-md"
        style={{
          left: isLight ? '2px' : 'auto',
          right: isLight ? 'auto' : '2px',
        }}
      />
      <div className="relative w-full h-full flex justify-around items-center">
         <AnimatePresence initial={false}>
            {isLight ? (
              <motion.div key="sun" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                <SunIcon />
              </motion.div>
            ) : <div />}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {!isLight ? (
            <motion.div key="moon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
              <MoonIcon />
            </motion.div>
          ) : <div />}
        </AnimatePresence>
      </div>
    </button>
  )
}
