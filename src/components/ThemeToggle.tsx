
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
    return <div className="w-[70px] h-9 rounded-full bg-muted" />
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const uniqueId = "moon-clip"

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-9 rounded-full cursor-pointer transition-colors duration-500 ease-in-out",
        isDark ? "bg-[#1E293B] justify-end" : "bg-[#8B5CF6] justify-start"
      )}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={uniqueId}>
            {/* This is the base circle */}
            <circle cx="14" cy="14" r="14" />
            {/* This is the circle that cuts out the crescent shape.
                We animate its position (`cx`) to create the effect. */}
            <motion.circle
              cx={isDark ? 20 : 40}
              cy="14"
              r="14"
              transition={spring}
            />
          </clipPath>
        </defs>
      </svg>
      
      {/* Stars */}
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

      {/* Main sliding circle */}
      <motion.div
        className="w-7 h-7 bg-white rounded-full shadow-md z-10"
        layout
        transition={spring}
        style={{
          clipPath: isDark ? `url(#${uniqueId})` : "none"
        }}
      />
    </button>
  )
}
