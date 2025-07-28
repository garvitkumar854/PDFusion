"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

const Stars = () => (
    <>
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ top: "20%", left: "25%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "40%", left: "15%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
       <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "65%", left: "30%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </>
)

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-16 h-8 rounded-full bg-muted" />
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center w-16 h-8 rounded-full cursor-pointer overflow-hidden"
      animate={{ backgroundColor: isDark ? "#1E293B" : "#87CEEB" }}
      transition={{ duration: 0.5 }}
    >
        <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
                <motion.div
                    key="dark"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 34, opacity: 1 }}
                    exit={{ x: 80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute text-white"
                >
                    <Stars />
                    <MoonIcon className="w-6 h-6"/>
                </motion.div>
            ) : (
                 <motion.div
                    key="light"
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 8, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute text-yellow-300"
                >
                    <SunIcon className="w-6 h-6" fill="currentColor"/>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.button>
  )
}
