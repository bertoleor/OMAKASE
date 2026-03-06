"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if viewport is mobile size
 * @param breakpoint - Width in pixels (default: 768 for md)
 */
export function useMediaQuery(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (globalThis.window === undefined) return;

    const checkSize = () => {
      setIsMobile(globalThis.window.innerWidth < breakpoint);
    };

    // Initial check
    checkSize();

    // Listen for resize
    globalThis.window.addEventListener("resize", checkSize);

    return () => globalThis.window.removeEventListener("resize", checkSize);
  }, [breakpoint]);

  return isMobile;
}
