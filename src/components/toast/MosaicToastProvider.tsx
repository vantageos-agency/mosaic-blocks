/**
 * MosaicToastProvider — presentational fixed-position toast stack container
 *
 * Presentational atom. Anchors a vertical stack of `MosaicToast` elements to
 * one screen corner/edge and stacks them with a fixed gap. It owns no state
 * and no queue: the host renders whichever `MosaicToast` elements are
 * currently visible as `children`, in the order it wants them stacked — this
 * component only positions the resulting stack on screen.
 *
 * Autonomous: does NOT depend on `MosaicToast` itself — any content can be
 * passed as `children`, mirroring the rest of the library's host-controlled
 * composition pattern.
 *
 * Pattern: MosaicApprovalPrompt.tsx (data-slot, inline cn, React 19 ref
 * prop, displayName, JSDoc, pure variants module).
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: none directly (the stack itself is unstyled beyond
 * position/spacing) — visual tokens live on the `MosaicToast` children.
 * a11y: the container is `pointer-events-none` so it never intercepts
 * clicks meant for content underneath; each toast re-enables pointer events
 * on itself (native `<button>`/interactive elements are always clickable
 * regardless of an ancestor's `pointer-events: none`... in practice hosts
 * commonly leave toasts non-interactive except for the dismiss button,
 * which still receives events because `pointer-events` do not cascade to
 * elements given their own explicit `pointer-events: auto`; MosaicToast
 * does not set that here, so a host embedding interactive `action` nodes
 * should override `className` on `MosaicToastProvider` if needed).
 * Bilingual: no user-facing copy — the container renders no text of its own.
 */

import type * as React from "react";
import { toastProviderPositionVariants } from "./toast-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Screen anchor for the toast stack. */
export type MosaicToastProviderPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

export interface MosaicToastProviderProps {
  /** The currently visible toasts, host-ordered. */
  children: React.ReactNode;
  /** Screen anchor for the stack. Defaults to "top-right" (a layout default, not visible copy). */
  position?: MosaicToastProviderPosition;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicToastProvider — production toast-stack positioning atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: fixes `children` to one screen corner/edge and
 * stacks them with a gap. No state, no queue, no timers — those live on
 * each `MosaicToast` child (`durationMs`) or on the host.
 */
export function MosaicToastProvider({
  children,
  position = "top-right",
  className,
  ref,
}: MosaicToastProviderProps) {
  return (
    <div
      ref={ref}
      data-slot="toast-provider"
      className={cn(toastProviderPositionVariants({ position }), className)}
    >
      {children}
    </div>
  );
}

MosaicToastProvider.displayName = "MosaicToastProvider";
