"use client";

import { useEffect, useRef, useState } from 'react';

const THRESHOLD_PX = 10;

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.pageYOffset;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - lastScrollY.current) >= THRESHOLD_PX) {
        const direction = scrollY > lastScrollY.current ? 'down' : 'up';
        // Returning the previous value keeps React from re-rendering on every
        // rAF tick once the direction has settled.
        setScrollDirection((prev) => (prev === direction ? prev : direction));
        lastScrollY.current = scrollY > 0 ? scrollY : 0;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Registered once for the lifetime of the component (the previous version
    // re-attached the listener on every direction change) and passive so it
    // never blocks scrolling.
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrollDirection;
}
