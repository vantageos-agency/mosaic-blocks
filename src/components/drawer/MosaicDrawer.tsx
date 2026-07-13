"use client";

/**
 * MosaicDrawer — agent detail viewed as a side panel (SW-xx)
 *
 * Ported (source: any-debate-ai components/ui/drawer.tsx) — the upstream
 * component wraps `vaul`. This port re-implements the same side-panel
 * pattern on `@base-ui/react/dialog` instead: `vaul` is not a locked
 * production dependency for @vantageos/mosaic-blocks, and Base UI's Dialog
 * primitive already ships everything a drawer needs — focus trap, Escape,
 * focus return to the trigger, and an inert (non-focusable) background —
 * for free, out of the box, with `modal` (the default).
 *
 * Fully host-controlled: `open` + `onOpenChange` come from the caller, the
 * component keeps no state of its own (cf. MosaicResizableSplitPane /
 * MosaicAdaptiveModal convention in this package).
 *
 * Why a drawer and not a modal: this is the agent detail sheet — the caller
 * consults the record *without losing the list* behind it. A centered modal
 * hides that list; a side drawer keeps it in view. `side` (left/right/top/
 * bottom) is a cva variant, so the same component serves a right-hand
 * detail panel, a left nav drawer, or a bottom sheet on mobile.
 *
 * data-slot="drawer" on the popup root (matches upstream slot naming),
 * "drawer-backdrop" on the backdrop, "drawer-header"/"drawer-footer" for
 * layout regions supplied by the host as children.
 *
 * SIN-01: every visible string (`title`, `closeAriaLabel`) is a REQUIRED
 * prop with no default — the library carries no copy, the host owns i18n.
 */

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";
import { drawerBackdropVariants, drawerPopupVariants } from "./drawer-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicDrawerProps {
  /** Controlled open state — the host owns the truth. */
  open: boolean;
  /** Controlled state setter, called on every open/close intent. */
  onOpenChange: (open: boolean) => void;
  /**
   * Visible drawer title, wired to `aria-labelledby`. Required — no
   * default, no fallback. The host supplies the localized string.
   */
  title: string;
  /**
   * aria-label for the close button. Required — the host owns the
   * language (e.g. `t('Drawer.aria.close')`). No default, no fallback.
   */
  closeAriaLabel: string;
  children: React.ReactNode;
  /** Panel edge + slide direction. @default "right" */
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

/**
 * MosaicDrawer — side panel showing agent (or any record) detail without
 * covering the list behind it.
 *
 * @example
 * // Host owns i18n (e.g. next-intl) — title/closeAriaLabel always required.
 * <MosaicDrawer
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={agent.name}
 *   closeAriaLabel={t('Drawer.aria.close')}
 *   side="right"
 * >
 *   <p>Agent detail body</p> // allow-hardcode-i18n: JSDoc @example doc comment, not shipped code
 * </MosaicDrawer>
 */
export function MosaicDrawer({
  open,
  onOpenChange,
  title,
  closeAriaLabel,
  children,
  side = "right",
  className,
}: MosaicDrawerProps) {
  const titleId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)} modal>
      <Dialog.Portal>
        <Dialog.Backdrop data-slot="drawer-backdrop" className={drawerBackdropVariants()} />
        <Dialog.Popup
          data-slot="drawer"
          aria-labelledby={titleId}
          aria-modal="true"
          className={cn(drawerPopupVariants({ side }), className)}
        >
          <div
            data-slot="drawer-header"
            className="flex items-center justify-between gap-4 border-b border-border p-4"
          >
            <Dialog.Title id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label={closeAriaLabel}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <svg
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

MosaicDrawer.displayName = "MosaicDrawer";
