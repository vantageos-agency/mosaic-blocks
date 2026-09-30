"use client";

/**
 * MosaicThemeToggle — light / dark / system theme toggle
 *
 * Ported from heyfabrika/styleui components/theme-toggle (MIT).
 * Flips `data-theme` attribute on document.documentElement.
 * Theme-reactive: reads current state from DOM on mount.
 * No hardcoded branding — icon is a pure SVG, all color via theme tokens
 * (Tailwind utilities wired from @vantageos/mosaic-tokens / mosaic-blocks
 * styles.css) — never an inline literal OKLCH value.
 *
 * Wave-1 T5 reopen defect 3: the previous build used an arbitrary
 * `bg-[oklch(var(--mosaic-surface,1_0_0))]` value. `--mosaic-surface` (bare,
 * no suffix) is not a real token anywhere in this package — the fallback
 * `1 0 0` (solid white) always won, so the button rendered a white disc in
 * BOTH themes, and its `currentColor` icon (white foreground in dark mode)
 * disappeared into it. Fixed by using the real wired tokens: `bg-secondary`
 * (a neutral/ghost surface, distinct in both modes) + `text-foreground`
 * (explicit icon colour) + `hover:bg-accent` for the ghost hover state.
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
  /** aria-label override for the toggle button (takes precedence over the dynamic labels below). */
  label?: string;
  /** aria-label when toggling would switch to light theme. Required, no default. */
  switchToLightLabel: string;
  /** aria-label when toggling would switch to dark theme. Required, no default. */
  switchToDarkLabel: string;
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
  switchToLightLabel,
  switchToDarkLabel,
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

  const ariaLabel = label ?? (isDark ? switchToLightLabel : switchToDarkLabel);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isDark}
      onClick={handleToggle}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border",
        "bg-secondary text-foreground transition-colors hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
