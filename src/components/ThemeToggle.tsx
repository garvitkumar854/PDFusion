
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
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
    return <div className="w-[70px] h-[34px] rounded-full bg-muted" />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center w-[70px] h-[34px] rounded-full cursor-pointer transition-colors duration-500 ease-in-out",
        isLight ? "bg-primary/20" : "bg-black"
      )}
    >
      <AnimatePresence>
        {isLight ? (
           <motion.div
            key="sun-stars"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute left-2 text-yellow-400"
          >
            {/* You can add sun-related elements here if you want */}
          </motion.div>
        ) : (
          <motion.div
            key="moon-stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full flex items-center justify-end pr-[18px]"
          >
            {/* Stars */}
            <div className="absolute left-[12px] top-[8px] w-1 h-1 bg-white rounded-full" style={{ opacity: 0.8 }}/>
            <div className="absolute left-[20px] top-[18px] w-[3px] h-[3px] bg-white rounded-full" style={{ opacity: 0.6 }}/>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute h-[26px] w-[26px] bg-white rounded-full"
        layout
        transition={spring}
        style={{
            left: isLight ? '4px' : 'auto',
            right: isLight ? 'auto' : '4px',
        }}
      >
        <div className="relative w-full h-full">
            {/* Moon Craters */}
            <AnimatePresence>
            {!isLight && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="absolute inset-0"
                >
                    <div className="absolute top-[5px] right-[4px] w-[5px] h-[5px] bg-slate-200 rounded-full" />
                    <div className="absolute top-[12px] right-[10px] w-[3px] h-[3px] bg-slate-200 rounded-full" />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </button>
  );
}
