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
    if (typeof window === "undefined") return;

    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkSize();

    // Listen for resize
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, [breakpoint]);

  return isMobile;
}
