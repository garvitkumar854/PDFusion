
"use client";

import { motion } from "framer-motion";

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const dotVariants = {
  initial: {
    y: "0%",
  },
  animate: {
    y: "100%",
  },
};

const dotTransition = {
  duration: 0.5,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut",
};


const LoadingDots = () => {
  return (
    <motion.div
        className="flex h-5 w-20 items-end justify-center gap-1"
        variants={containerVariants}
        initial="initial"
        animate="animate"
    >
      <motion.span
        className="block h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        transition={dotTransition}
      />
      <motion.span
        className="block h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        transition={dotTransition}
      />
      <motion.span
        className="block h-3 w-3 rounded-full bg-primary"
        variants={dotVariants}
        transition={dotTransition}
      />
    </motion.div>
  );
};

export default LoadingDots;
