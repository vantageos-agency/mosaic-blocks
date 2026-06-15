/**
 * useMediaQuery — SSR-safe media query hook
 *
 * Ported from heyfabrika/styleui hooks/use-media-query.ts (MIT).
 * SSR-safe: returns false during server render (no window access at render time).
 * Subscribes via addEventListener("change") in useEffect only.
 */

import { useEffect, useState } from "react";

/**
 * SSR-safe hook that returns true when the given CSS media query matches.
 *
 * @param query - A valid CSS media query string, e.g. "(min-width: 768px)"
 * @returns boolean — false during SSR / before hydration, then reflects real match
 *
 * @example
 * const isMd = useMediaQuery("(min-width: 768px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  // Default to false to be SSR-safe (no window during server render)
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Only runs in browser
    const mql = window.matchMedia(query);
    // Sync initial value after mount
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => {
      mql.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}
