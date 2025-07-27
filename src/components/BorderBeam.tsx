"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "hsl(var(--primary))",
  colorTo = "hsl(var(--primary) / 0.5)",
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [path, setPath] = React.useState("");

  useEffect(() => {
    const div = ref.current;
    if (div) {
      const { border, top, left } = getComputedStyle(div);
      const borderWidth = parseInt(border.split(" ")[0]);
      const radius = parseInt(top.split(" ")[0]);

      setPath(
        `M${left},${top + radius} a${radius},${radius} 0 0 1 ${radius},-${radius} h${
          div.clientWidth - 2 * radius
        } a${radius},${radius} 0 0 1 ${radius},${radius} v${
          div.clientHeight - 2 * radius
        } a${radius},${radius} 0 0 1 -${radius},${radius} h-${
          div.clientWidth - 2 * radius
        } a${radius},${radius} 0 0 1 -${radius},-${radius} z`
      );
    }
  }, []);

  return (
    <div
      ref={ref}
      style={
        {
          "--size": size,
          "--duration": duration,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "absolute inset-0 rounded-2xl [border:calc(var(--border-width)*1px)_solid_transparent]",
        // mask styles
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        // hocus styles
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--size)*1px)_50%] after:[offset-path:border-box]",
        className
      )}
    >
      <svg
        className="invisible absolute h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} vectorEffect="non-scaling-stroke"></path>
      </svg>
    </div>
  );
};

export default BorderBeam;
