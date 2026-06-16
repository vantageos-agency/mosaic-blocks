"use client";

/**
 * MosaicThemeToggle — light / dark / system theme toggle
 *
 * Ported from heyfabrika/styleui components/theme-toggle (MIT).
 * Flips `data-theme` attribute on document.documentElement.
 * Theme-reactive: reads current state from DOM on mount.
 * No hardcoded branding — icon is a pure SVG, all color via OKLCH CSS vars.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

export interface MosaicThemeToggleProps {
  /**
   * Ordered list of theme values to cycle through.
   * Default: ["light", "dark"]
   */
  themes?: Theme[];
  /** Called with the new theme string after each toggle */
  onChange?: (theme: Theme) => void;
  className?: string;
  /** aria-label for the toggle button */
  label?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicThemeToggle — cycles through themes, setting `data-theme` on
 * document.documentElement. Works with any OKLCH-var-based CSS theme.
 *
 * @example
 * <MosaicThemeToggle onChange={(t) => console.log("theme:", t)} />
 */
export function MosaicThemeToggle({
  themes = ["light", "dark"],
  onChange,
  className,
  label,
  ref,
}: MosaicThemeToggleProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    // SSR-safe: read from DOM if available, else default to first theme
    if (typeof document === "undefined") return themes[0];
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    return current && themes.includes(current) ? current : themes[0];
  });

  const applyTheme = React.useCallback(
    (next: Theme) => {
      const resolved = next === "system" ? getSystemTheme() : next;
      document.documentElement.setAttribute("data-theme", resolved);
      setTheme(next);
      onChange?.(next);
    },
    [onChange],
  );

  const handleToggle = () => {
    const idx = themes.indexOf(theme);
    const next = themes[(idx + 1) % themes.length];
    applyTheme(next);
  };

  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && getSystemTheme() === "dark");

  const ariaLabel = label ?? (isDark ? "Switch to light theme" : "Switch to dark theme");

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isDark}
      onClick={handleToggle}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-[oklch(0.9_0.005_250)] bg-[oklch(var(--mosaic-surface,1_0_0))] transition-colors hover:bg-[oklch(0.95_0.005_250)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.15_250)]",
        className,
      )}
    >
      {/* Sun icon — shown in dark mode */}
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        /* Moon icon — shown in light mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

MosaicThemeToggle.displayName = "MosaicThemeToggle";
