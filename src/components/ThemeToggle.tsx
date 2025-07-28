
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

const sunRays = [0, 45, 90, 135, 180, 225, 270, 315];

const SunIcon = () => (
  <motion.svg
    key="sun"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
    animate={{
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { ...spring, delay: 0.1 },
    }}
    exit={{
      scale: 0.5,
      opacity: 0,
      rotate: 90,
      transition: { ...spring, duration: 0.2 },
    }}
  >
    <circle cx="12" cy="12" r="4" />
    {sunRays.map((rot, i) => (
      <motion.line
        key={i}
        x1="12"
        y1="1"
        x2="12"
        y2="3"
        initial={{ transform: `rotate(${rot}deg)`, opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 + i * 0.02 } }}
      />
    ))}
  </motion.svg>
);

const MoonIcon = () => (
  <motion.svg
    key="moon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
    animate={{
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { ...spring, delay: 0.1 },
    }}
    exit={{
      scale: 0.5,
      opacity: 0,
      rotate: -90,
      transition: { ...spring, duration: 0.2 },
    }}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </motion.svg>
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
    return <div className="w-16 h-8 rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  return (
    <div className="relative flex items-center">
        <motion.button
          onClick={toggleTheme}
          className={cn(
            "relative flex h-8 w-16 items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          style={{
             background: isLight ? 'linear-gradient(180deg, #4481eb, #04befe)' : 'linear-gradient(180deg, #0b1a2c, #244163)',
             boxShadow: isLight ? 'inset 0 1px 1px #fff, 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5)',
          }}
          aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
        >
          <motion.div
            className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md z-10"
            layout
            transition={spring}
            style={{ right: isLight ? 'auto' : '0.25rem', left: isLight ? '0.25rem' : 'auto' }}
          />

          <div className="absolute inset-0 flex items-center justify-between px-2 text-primary-foreground">
             <div className={cn("transition-colors", isLight ? "text-transparent" : "text-yellow-300")}>
                <AnimatePresence>
                  {!isLight && <MoonIcon />}
                </AnimatePresence>
             </div>
             <div className={cn("transition-colors", !isLight ? "text-transparent" : "text-yellow-400")}>
                <AnimatePresence>
                  {isLight && <SunIcon />}
                </AnimatePresence>
             </div>
          </div>
        </motion.button>
    </div>
  )
}
