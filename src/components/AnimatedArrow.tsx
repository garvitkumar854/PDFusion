
'use client';

import { motion } from 'framer-motion';

interface AnimatedArrowProps {
  isHovered: boolean;
}

const AnimatedArrow = ({ isHovered }: AnimatedArrowProps) => {
    const arrowVariants = {
        initial: { x: 0, y: 0 },
        hover: {
            x: '100%',
            y: '-100%',
            transition: { duration: 0.2, ease: 'easeOut' }
        },
    };

    const secondArrowVariants = {
         initial: { x: '-100%', y: '100%' },
         hover: {
            x: 0,
            y: 0,
            transition: { duration: 0.2, ease: 'easeOut', delay: 0.05 }
        },
    }

    return (
        <div className="ml-2 w-5 h-5 relative overflow-hidden">
            <motion.div
                animate={isHovered ? "hover" : "initial"}
                initial="initial"
                className="absolute inset-0 flex items-center justify-center"
            >
                <motion.div
                    variants={arrowVariants}
                    className="absolute inset-0 flex items-center justify-center"
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </motion.div>
                 <motion.div
                    variants={secondArrowVariants}
                    className="absolute inset-0 flex items-center justify-center"
                >
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AnimatedArrow;
