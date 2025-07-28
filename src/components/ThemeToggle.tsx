
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
};

const sunRays = [0, 45, 90, 135, 180, 225, 270, 315].map((rot) => ({
  rot,
  y1: 8,
  y2: 10,
}));

const moonCraters = [
  { cx: 16, cy: 8, r: 2 },
  { cx: 8, cy: 15, r: 1.5 },
  { cx: 9, cy: 7, r: 1 },
];

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
      className={`relative flex items-center w-[70px] h-[34px] rounded-full p-1 transition-colors duration-500 ${
        isLight ? 'bg-sky-400' : 'bg-indigo-900'
      }`}
    >
      <motion.div
        className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
        layout
        transition={spring}
        style={{
          left: isLight ? '4px' : '40px'
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Sun Rays */}
          <motion.g
            initial={false}
            animate={{ scale: isLight ? 1 : 0, opacity: isLight ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ transformOrigin: 'center center' }}
          >
            {sunRays.map((ray, i) => (
              <line
                key={i}
                x1="12"
                y1={ray.y1}
                x2="12"
                y2={ray.y2}
                stroke={isLight ? "orange" : "white"}
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${ray.rot} 12 12)`}
              />
            ))}
          </motion.g>

          {/* Moon Craters */}
          <motion.g
            initial={false}
            animate={{ scale: isLight ? 0 : 1, opacity: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ transformOrigin: 'center center' }}
          >
            {moonCraters.map((crater, i) => (
              <circle
                key={i}
                cx={crater.cx}
                cy={crater.cy}
                r={crater.r}
                fill={isLight ? "white" : "#d1d5db"}
              />
            ))}
          </motion.g>
        </svg>
      </motion.div>
    </button>
  );
}
