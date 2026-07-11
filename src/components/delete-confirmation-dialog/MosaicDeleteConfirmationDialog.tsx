"use client";

/**
 * MosaicDeleteConfirmationDialog — generic destructive-action confirm dialog
 *
 * Ported from components/shared/delete-confirmation-dialog.tsx
 *
 * Built on @base-ui/react AlertDialog primitives (namespace import).
 * Zero branding, zero debate coupling. Labels and item info are props.
 */

import { AlertDialog } from "@base-ui/react/alert-dialog";
import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicDeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the open state should change */
  onOpenChange: (open: boolean) => void;
  /** Called when the user confirms deletion */
  onConfirm: () => void;
  /** Human-readable name of the item to be deleted */
  itemName: string;
  /** Type label shown in the title and button ("agent", "template", etc.). Required, no default. */
  itemType: string;
  /** Dialog title. Required — the host owns the language, no default. */
  title: string;
  /** Dialog description. Required — the host owns the language, no default. */
  description: string;
  /** Cancel button label. Required, no default. */
  cancelLabel: string;
  /** Confirm button label. Required, no default. */
  confirmLabel: string;
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-delete-dialog-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-dialog-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes mosaic-dialog-in {
      from { opacity: 0; transform: translate(-50%, calc(-50% - 8px)) scale(0.97); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    .mosaic-delete-overlay {
      animation: mosaic-dialog-overlay-in 150ms ease-out forwards;
    }
    .mosaic-delete-content {
      animation: mosaic-dialog-in 180ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-delete-overlay,
      .mosaic-delete-content {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicDeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  cancelLabel,
  confirmLabel,
}: MosaicDeleteConfirmationDialogProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn("mosaic-delete-overlay", "fixed inset-0 z-50 bg-black/50")}
        />
        <AlertDialog.Popup
          data-slot="delete-confirmation-dialog"
          className={cn(
            "mosaic-delete-content",
            "fixed left-1/2 top-1/2 z-50",
            "w-full max-w-[92vw] sm:max-w-md",
            "rounded-lg border border-border bg-background p-6 shadow-xl",
          )}
        >
          <AlertDialog.Title className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              className={cn(
                "inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border",
                "bg-background px-4 py-2 text-sm font-medium text-foreground",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "sm:w-auto",
              )}
            >
              {cancelLabel}
            </AlertDialog.Close>
            <AlertDialog.Close
              onClick={onConfirm}
              className={cn(
                "inline-flex min-h-[44px] w-full items-center justify-center rounded-md",
                "bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground",
                "hover:bg-destructive/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "sm:w-auto",
              )}
            >
              {confirmLabel}
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

MosaicDeleteConfirmationDialog.displayName = "MosaicDeleteConfirmationDialog";
