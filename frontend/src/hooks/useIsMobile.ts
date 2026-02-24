import { useState, useEffect } from "react";

/** Default breakpoint below which the layout switches to mobile mode (px). */
const DEFAULT_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport width is below the given breakpoint.
 * SSR-safe: defaults to `false` when `window` is unavailable.
 * Updates in real-time via the `matchMedia` `change` event.
 */
export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    // Sync in case the initial useState closure was stale
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
