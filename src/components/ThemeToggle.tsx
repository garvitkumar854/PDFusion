
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

const sunAndMoonColors = {
    light: {
        background: "#bae6fd", // sky-200
        circle: "#f0f9ff", // sky-50
        mask: "#0ea5e9", // sky-500
    },
    dark: {
        background: "#0c4a6e", // sky-900
        circle: "#0369a1", // sky-700
        mask: "#e0f2fe", // sky-100
    },
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
  const colors = isLight ? sunAndMoonColors.light : sunAndMoonColors.dark;

  return (
    <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="relative w-[70px] h-[34px] rounded-full overflow-hidden"
    >
        <motion.div
            className="w-full h-full"
            animate={{ backgroundColor: colors.background }}
            transition={spring}
        >
            <svg viewBox="0 0 70 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-main">
                    <rect x="0" y="0" width="70" height="34" fill="white" />
                    <motion.circle
                        cx={isLight ? 17 : 53}
                        cy="17"
                        r="12"
                        fill="black"
                        transition={spring}
                    />
                     <motion.circle
                        cx={isLight ? 45 : 81}
                        cy="11"
                        r="4"
                        fill="black"
                        transition={spring}
                    />
                     <motion.circle
                        cx={isLight ? 53 : 89}
                        cy="21"
                        r="2.5"
                        fill="black"
                        transition={spring}
                    />
                </mask>
                <motion.rect
                    x="0"
                    y="0"
                    width="70"
                    height="34"
                    mask="url(#mask-main)"
                    animate={{ fill: colors.mask }}
                    transition={spring}
                />
            </svg>
        </motion.div>
    </button>
  );
}
