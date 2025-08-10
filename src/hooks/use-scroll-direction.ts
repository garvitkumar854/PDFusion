
"use client";

import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }
      
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    
    // Set initial direction
    updateScrollDirection();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollDirection]);

  return scrollDirection;
}
