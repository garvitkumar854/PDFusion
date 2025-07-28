"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
        "group"
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
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: "easeInOut" }}
              className="absolute bg-white rounded-full"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 60 + 20}%`,
                left: `${Math.random() * 45 + 5}%`,
              }}
            />
          ))
        )}
      </AnimatePresence>

      <motion.div
        className="h-[30px] w-[30px] rounded-full z-10"
        layout
        transition={spring}
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          initial={false}
          animate={{
            transform: isLight ? 'translateX(100%)' : 'translateX(0%)',
            transition: { ...spring, delay: 0.05 },
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B' // Masking circle
          }}
          style={{
            transformOrigin: 'center center',
            scale: 0.9,
          }}
        />
      </motion.div>
    </motion.button>
  )
}
