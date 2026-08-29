
import { useState, useEffect, RefObject } from "react";

export function useOnScreen(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    // Capture the node: React can null out ref.current before this effect's
    // cleanup runs, which would leave the observer attached.
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref]);

  return isIntersecting;
}
