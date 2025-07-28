
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
)

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
)

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!isMounted) {
    return <div className="w-[70px] h-[38px] rounded-full bg-muted" />
  }

  const isLight = theme === "light"

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-[38px] rounded-full cursor-pointer p-1 transition-colors duration-500 ease-in-out",
      )}
      initial={false}
      animate={{ backgroundColor: isLight ? "#8B5CF6" : "#1E293B" }}
      style={{ justifyContent: isLight ? "flex-start" : "flex-end" }}
    >
      <AnimatePresence>
        {!isLight && (
          [...Array(3)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 60 + 15}%`,
                left: `${Math.random() * 40 + 5}%`,
              }}
            />
          ))
        )}
      </AnimatePresence>
      <motion.div
        className="h-[30px] w-[30px] bg-white rounded-full z-10 flex items-center justify-center"
        layout
        transition={spring}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLight ? "sun" : "moon"}
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            {isLight ? (
              <SunIcon className="w-5 h-5 text-yellow-500" />
            ) : (
              <MoonIcon className="w-5 h-5 text-slate-800" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.button>
  )
}
