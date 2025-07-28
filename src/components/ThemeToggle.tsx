
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="w-[70px] h-[38px] rounded-full bg-muted" />
  }

  const isLight = theme === "light"

  const toggleTheme = () => {
    setTheme(isLight ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-[38px] rounded-full cursor-pointer transition-colors duration-300 ease-in-out",
        isLight ? "bg-[#8B5CF6]" : "bg-[#1E293B]",
        "justify-start"
      )}
      style={{ justifyContent: isLight ? "flex-start" : "flex-end" }}
    >
      <AnimatePresence>
        {!isLight && (
          [...Array(2)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: "easeInOut" }}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 40 + 20}%`,
                left: `${Math.random() * 40 + 5}%`,
              }}
            />
          ))
        )}
      </AnimatePresence>

      <motion.div
        className="h-[30px] w-[30px] rounded-full z-10 m-1 relative overflow-hidden"
        layout
        transition={spring}
      >
        <motion.div
          className="absolute inset-0 bg-white rounded-full"
          initial={false}
          animate={{ rotate: isLight ? 0 : 40 }}
          transition={spring}
        />
        {/* This is the masking circle that creates the crescent moon */}
        <motion.div
          className="absolute -right-2 top-0 h-[28px] w-[28px] rounded-full"
          style={{ backgroundColor: isLight ? "rgba(255,255,255,0)" : "#1E293B" }}
          initial={false}
          animate={{ 
            translateX: isLight ? 40 : 0,
            scale: isLight ? 0.5 : 1
          }}
          transition={spring}
        />
      </motion.div>
    </button>
  )
}
