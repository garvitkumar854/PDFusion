
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
}

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder to prevent layout shifts
    return <div className="w-[70px] h-9 rounded-full bg-muted" />
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-9 rounded-full cursor-pointer transition-colors duration-500 ease-in-out",
        isDark ? "bg-[#1E293B] justify-end" : "bg-[#8B5CF6] justify-start",
        "p-1" // Add padding to contain the inner circle
      )}
    >
      {/* Stars - only visible in dark mode */}
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ top: "25%", left: "20%" }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.3, delay: isDark ? 0.2 : 0 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "60%", left: "35%" }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.3, delay: isDark ? 0.3 : 0 }}
      />

      {/* The main sliding circle/moon */}
      <motion.div
        className="relative w-7 h-7 bg-white rounded-full shadow-md z-10"
        layout
        transition={spring}
      >
        {/* Masking circle to create the crescent moon shape */}
        <motion.div
          className="absolute w-7 h-7 rounded-full"
          style={{
            top: '0px',
            right: '-3px', // Positioned to cut out the crescent from the left
            backgroundColor: '#1E293B', // Must match the dark background color
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={spring}
        />
      </motion.div>
    </button>
  )
}
