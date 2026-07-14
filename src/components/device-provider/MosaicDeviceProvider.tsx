"use client";

/**
 * MosaicDeviceProvider — responsive device context (PC-01)
 *
 * Ported (source: private upstream) contexts/DeviceProvider.tsx +
 * hooks/responsive/*.ts (branch: dev).
 *
 * Provides a single context with breakpoint flags, orientation, and viewport
 * size. All adaptive components consume this via useDevice().
 *
 * Stripped: debugResponsive import (dev-only console logger, not portable).
 * Animation: none (context-only).
 * Framer-motion: N/A.
 * SSR: guarded via typeof window checks in each hook.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Orientation = "portrait" | "landscape";
export type Breakpoint = "sm" | "md" | "lg" | "xl";

export interface DeviceContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmUp: boolean;
  isMdUp: boolean;
  isLgUp: boolean;
  isXlUp: boolean;
  orientation: Orientation;
  viewport: { width: number; height: number };
  isBreakpoint: (bp: Breakpoint) => boolean;
}

// Tailwind v4 default breakpoints (px)
const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * useBreakpoint — returns true when viewport >= breakpoint (min-width media query).
 * SSR-safe: initialises to false on server. Subscribes to matchMedia change events.
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
    setMatches(mq.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return matches;
}

/** Returns true when viewport is mobile (< md). */
export function useIsMobile(): boolean {
  const isMd = useBreakpoint("md");
  return !isMd;
}

/** Returns true when viewport is tablet (md ≤ width < lg). */
export function useIsTablet(): boolean {
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  return isMd && !isLg;
}

/** Returns true when viewport is desktop (≥ lg). */
export function useIsDesktop(): boolean {
  return useBreakpoint("lg");
}

/**
 * useViewport — debounced resize listener returning { width, height }.
 * Initialises to { 0, 0 } on SSR.
 */
export function useViewport(): { width: number; height: number } {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();

    let tid: ReturnType<typeof setTimeout>;
    const debounced = () => {
      clearTimeout(tid);
      tid = setTimeout(update, 100);
    };

    window.addEventListener("resize", debounced);
    return () => {
      window.removeEventListener("resize", debounced);
      clearTimeout(tid);
    };
  }, []);

  return size;
}

/**
 * useOrientation — returns "portrait" | "landscape".
 * Listens to both resize and orientationchange for full coverage.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return orientation;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DeviceContext = React.createContext<DeviceContextValue | undefined>(undefined);

export interface MosaicDeviceProviderProps {
  children: React.ReactNode;
}

/**
 * MosaicDeviceProvider — wrap your app (or subtree) to enable useDevice().
 *
 * @example
 * <MosaicDeviceProvider>
 *   <App />
 * </MosaicDeviceProvider>
 */
export function MosaicDeviceProvider({ children }: MosaicDeviceProviderProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isSmUp = useBreakpoint("sm");
  const isMdUp = useBreakpoint("md");
  const isLgUp = useBreakpoint("lg");
  const isXlUp = useBreakpoint("xl");
  const orientation = useOrientation();
  const viewport = useViewport();

  const isBreakpoint = React.useCallback(
    (bp: Breakpoint): boolean => {
      switch (bp) {
        case "sm":
          return isSmUp;
        case "md":
          return isMdUp;
        case "lg":
          return isLgUp;
        case "xl":
          return isXlUp;
      }
    },
    [isSmUp, isMdUp, isLgUp, isXlUp],
  );

  const value = React.useMemo<DeviceContextValue>(
    () => ({
      isMobile,
      isTablet,
      isDesktop,
      isSmUp,
      isMdUp,
      isLgUp,
      isXlUp,
      orientation,
      viewport,
      isBreakpoint,
    }),
    [
      isMobile,
      isTablet,
      isDesktop,
      isSmUp,
      isMdUp,
      isLgUp,
      isXlUp,
      orientation,
      viewport,
      isBreakpoint,
    ],
  );

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

MosaicDeviceProvider.displayName = "MosaicDeviceProvider";

// Developer-facing invariant errors — thrown only at hook-misuse time, never
// rendered to an end user (same class as MosaicClerkWebhookHandler's own
// errors). Kept as an object-literal constant, with the escape-hatch marker
// interleaved BETWEEN its properties, because a `//` comment placed
// immediately before a `throw new Error(...)` statement is stripped entirely
// by esbuild's unminified output and never reaches dist/index.cjs — a marker
// there would be silently ineffective (confirmed empirically; see
// no-hardcoded-words-guard.mjs's own header comment on this exact esbuild
// behaviour).
const DEVICE_PROVIDER_ERRORS = {
  // allow-hardcoded-word: developer-facing invariant error, never rendered to an end user
  missingProvider: "useDevice must be used within a MosaicDeviceProvider",
};

/**
 * useDevice — consume the device context.
 * Must be used inside <MosaicDeviceProvider>.
 */
export function useDevice(): DeviceContextValue {
  const ctx = React.useContext(DeviceContext);
  if (!ctx) {
    throw new Error(DEVICE_PROVIDER_ERRORS.missingProvider);
  }
  return ctx;
}
