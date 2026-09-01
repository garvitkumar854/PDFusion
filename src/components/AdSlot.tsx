"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ADSENSE_CLIENT, isAdSenseEnabled } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  /** Ad-unit slot ID from your AdSense account (data-ad-slot). */
  slot?: string;
  /** "auto" lets AdSense pick the best-fitting size for the space. */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  /** Vertical space reserved while the ad loads, to limit layout shift. */
  minHeight?: number;
};

/**
 * Renders a single responsive AdSense unit.
 *
 * Returns null unless a client AND a slot are configured, so an unconfigured
 * (or development) build shows nothing and requests nothing.
 */
export default function AdSlot({
  slot,
  format = "auto",
  className,
  minHeight = 90,
}: AdSlotProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isAdSenseEnabled || !slot || pushedRef.current) return;
    pushedRef.current = true;
    // The <ins> must already be in the DOM; AdSense fills it on push. The ref
    // guards against StrictMode double-invoking the effect in development.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad-blockers throw here; the page must keep working regardless.
    }
  }, [slot]);

  if (!isAdSenseEnabled || !slot) return null;

  return (
    <div className={cn("w-full", className)} aria-label="Advertisement">
      <ins
        className="adsbygoogle block"
        style={{ display: "block", minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
