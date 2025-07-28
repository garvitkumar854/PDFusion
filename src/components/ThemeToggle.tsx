"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

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
    <div
      className="flex h-8 w-16 cursor-pointer items-center rounded-full bg-blue-500 p-1 data-[dark=true]:bg-gray-800"
      data-dark={!isLight}
      onClick={toggleTheme}
    >
      <motion.div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-md"
        layout
        transition={spring}
      >
        <div className="relative h-full w-full">
          {/* Sun Rays */}
          <motion.div
            className="absolute inset-0"
            animate={{
              transform: isLight ? 'rotate(90deg)' : 'rotate(0deg)',
              opacity: isLight ? 1 : 0,
            }}
            transition={spring}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-[5px] w-[1px] origin-center -translate-x-1/2 -translate-y-1/2 transform-gpu bg-yellow-500"
                style={{ transform: `rotate(${i * 45}deg) translateY(-8px)` }}
              />
            ))}
          </motion.div>

          {/* Moon Craters */}
          <motion.div
             className="absolute inset-0"
            animate={{
              transform: isLight ? 'rotate(0deg)' : 'rotate(90deg)',
              opacity: isLight ? 0 : 1
            }}
            transition={spring}
          >
              <div
                className="absolute right-[3px] top-[4px] h-[4px] w-[4px] rounded-full bg-slate-400"
              />
              <div
                className="absolute bottom-[4px] right-[8px] h-[2px] w-[2px] rounded-full bg-slate-400"
              />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
