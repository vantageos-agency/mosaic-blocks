/**
 * MosaicToast — presentational ephemeral notification
 *
 * Presentational atom. Displays a short-lived status message (success /
 * error / info / warning) with an optional description, an optional
 * host-rendered action, and a required dismiss control. The component
 * performs no network call and owns no SDK / toast-stacking runtime:
 * dismissal is surfaced purely via the `onDismiss()` callback — the host
 * (typically paired with `MosaicToastProvider`) owns the actual queue of
 * visible toasts, their insertion order, and any exit animation.
 *
 * Auto-dismiss is opt-in via `durationMs`: when provided, the component
 * starts a single `setTimeout` on mount and calls `onDismiss()` once it
 * elapses (cleared on unmount / prop change). When `durationMs` is
 * omitted, the toast never dismisses itself — the host's dismiss button
 * (or its own external logic) is the only path to `onDismiss()`.
 *
 * Pattern: MosaicApprovalPrompt.tsx (data-slot, inline cn, React 19 ref
 * prop, displayName, JSDoc, pure variants module).
 * No "use client" in source — prepend-use-client.mjs adds it to dist; the
 * `useEffect` timer below requires the client runtime at use-time.
 * Design tokens: --foreground, --muted-foreground, --border,
 * --destructive, --card, --accent, --background (amber-* utility classes
 * for the "warning" variant, consistent with Tailwind's built-in palette).
 * a11y: the root carries `role="alert"` for the "error" variant (the only
 * variant that represents an unrecoverable failure worth interrupting the
 * screen-reader user for) and `role="status"` for every other variant —
 * both roles are implicitly live regions, so no extra `aria-live` is
 * needed. The dismiss button's accessible name IS the required
 * `dismissAriaLabel` prop — zero hardcoded copy, zero default.
 * Bilingual: every user-facing string (`title`/`description`/
 * `dismissAriaLabel`) is a required-or-explicit caller-supplied prop —
 * the library never generates its own copy.
 *
 * @example
 * <MosaicToast
 *   variant="success"
 *   title="Modifications enregistrées"
 *   description="Vos changements ont été appliqués."
 *   onDismiss={() => removeToast(id)}
 *   dismissAriaLabel="Fermer la notification"
 *   durationMs={5000}
 * />
 */

import type * as React from "react";
import { useEffect } from "react";
import {
  toastCardVariants,
  toastDismissButtonVariants,
  toastTitleVariants,
} from "./toast-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Visual + semantic tone of the toast. Drives styling AND the a11y role. */
export type MosaicToastVariant = "success" | "error" | "info" | "warning";

export interface MosaicToastProps {
  /** Visual + semantic tone. Drives the a11y role ("alert" for "error", "status" otherwise). */
  variant: MosaicToastVariant;
  /** Toast headline. Required, no default — the library never generates its own copy. */
  title: string;
  /** Optional supporting detail rendered below the title. */
  description?: string;
  /** Host-rendered action region (e.g. an "Undo" button). The library never decides its shape. */
  action?: React.ReactNode;
  /** Called when the toast is dismissed — by the dismiss button OR the `durationMs` timer. */
  onDismiss: () => void;
  /** Accessible name of the dismiss button. Required, no default. */
  dismissAriaLabel: string;
  /** When set, the toast auto-dismisses (`onDismiss()`) after this many milliseconds. */
  durationMs?: number;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicToast — production ephemeral-notification atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders variant + title + optional description +
 * optional host-rendered action + a required dismiss control, and reports
 * dismissal via `onDismiss()`. No network call, no SDK, no built-in copy,
 * no toast queue / stacking logic (that is `MosaicToastProvider`'s job, or
 * the host's).
 */
export function MosaicToast({
  variant,
  title,
  description,
  action,
  onDismiss,
  dismissAriaLabel,
  durationMs,
  className,
  ref,
}: MosaicToastProps) {
  useEffect(() => {
    if (durationMs === undefined) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      ref={ref}
      data-slot="toast"
      role={role}
      className={cn(toastCardVariants({ variant }), className)}
    >
      <div data-slot="toast-body" className="flex min-w-0 flex-1 flex-col gap-1">
        <p data-slot="toast-title" className={toastTitleVariants({ variant })}>
          {title}
        </p>
        {description !== undefined && (
          <p data-slot="toast-description" className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {action !== undefined && <div data-slot="toast-action">{action}</div>}
      </div>
      <button
        type="button"
        data-slot="toast-dismiss-button"
        onClick={onDismiss}
        aria-label={dismissAriaLabel}
        className={toastDismissButtonVariants()}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

MosaicToast.displayName = "MosaicToast";
