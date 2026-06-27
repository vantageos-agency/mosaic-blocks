"use client";

/**
 * MosaicThemeProvider — next-themes wrapper (generic)
 *
 * Ported from components/theme-provider.tsx
 *
 * Thin wrapper that accepts next-themes ThemeProvider as a peer dependency.
 * Consumers who use next-themes can pass it directly; otherwise falls back to
 * a plain div wrapper for SSR compatibility.
 *
 * This avoids a hard dep on next-themes in mosaic-blocks itself.
 */

import type * as React from "react";

export interface MosaicThemeProviderProps {
  children: React.ReactNode;
  /** next-themes ThemeProvider component — injected by caller */
  provider?: React.ComponentType<{ children: React.ReactNode; [key: string]: unknown }>;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  [key: string]: unknown;
}

/**
 * MosaicThemeProvider — wraps children with a theme provider.
 *
 * Pass `provider` = ThemeProvider from "next-themes" (or any compatible
 * theme provider) to enable full theme switching. If omitted, renders
 * children directly (no theme context).
 *
 * @example
 * import { ThemeProvider } from "next-themes"
 * <MosaicThemeProvider provider={ThemeProvider} attribute="class" defaultTheme="system" enableSystem>
 *   {children}
 * </MosaicThemeProvider>
 */
export function MosaicThemeProvider({
  children,
  provider: Provider,
  ...props
}: MosaicThemeProviderProps) {
  if (Provider) {
    return (
      <Provider {...props}>
        <div data-slot="theme-provider">{children}</div>
      </Provider>
    );
  }

  return <div data-slot="theme-provider">{children}</div>;
}

MosaicThemeProvider.displayName = "MosaicThemeProvider";
