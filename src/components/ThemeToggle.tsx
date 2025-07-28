
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
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!isMounted) {
    return <div className="w-16 h-8 rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  return (
    <div 
      className="relative flex items-center w-16 h-8 rounded-full p-1 cursor-pointer bg-blue-400/20 dark:bg-gray-800/50"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <motion.div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
        layout
        transition={spring}
      >
        <div className="relative h-full w-full">
          {/* Sun Rays */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: isLight ? 1 : 0, opacity: isLight ? 1 : 0, rotate: isLight ? 0 : -90 }}
            transition={spring}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-full w-0.5 origin-center"
                style={{ transform: `rotate(${i * 45}deg)` }}
              >
                <div className="absolute top-[-3px] h-2 w-full rounded-full bg-yellow-400"></div>
              </div>
            ))}
          </motion.div>
          {/* Moon Craters */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: isLight ? 0 : 1, opacity: isLight ? 0 : 1, rotate: isLight ? 90 : 0 }}
            transition={spring}
          >
            <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-slate-300 opacity-80" />
            <div className="absolute bottom-1 left-2 w-[5px] h-[5px] rounded-full bg-slate-300 opacity-90" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
