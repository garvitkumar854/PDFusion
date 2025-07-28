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
    // Render a skeleton or an empty div to prevent layout shift
    return <div className="w-[70px] h-[34px] rounded-full bg-muted" />
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
        "relative flex items-center w-[70px] h-[34px] rounded-full cursor-pointer transition-colors duration-500 ease-in-out px-1",
        isDark ? "bg-[#1E293B] justify-end" : "bg-[#8B5CF6] justify-start"
      )}
    >
      {/* Stars for dark mode */}
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ top: "25%", left: "15%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 1 }}
        transition={{ duration: 0.3, delay: isDark ? 0.2 : 0 }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{ top: "60%", left: "35%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 1 }}
        transition={{ duration: 0.3, delay: isDark ? 0.3 : 0 }}
      />
      
      {/* Sliding circle */}
      <motion.div
        className="relative w-[26px] h-[26px] bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden"
        layout
        transition={spring}
      >
          {/* Moon Mask */}
          <motion.div
            className="absolute w-[26px] h-[26px] bg-[#1E293B] rounded-full"
            initial={{x: 30}}
            animate={{ x: isDark ? 10 : 30 }}
            transition={{...spring, stiffness: 400, damping: 35}}
          />
      </motion.div>
    </button>
  )
}
