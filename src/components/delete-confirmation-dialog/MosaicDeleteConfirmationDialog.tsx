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
  /** Type label shown in the title and button ("agent", "template", etc.) */
  itemType?: string;
  /** Override the title text */
  title?: string;
  /** Override the description text */
  description?: string;
  /** Override the cancel button label */
  cancelLabel?: string;
  /** Override the confirm button label */
  confirmLabel?: string;
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
  itemName,
  itemType = "item",
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
}: MosaicDeleteConfirmationDialogProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  const resolvedTitle = title ?? `Delete ${itemType}?`;
  const resolvedDescription =
    description ?? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
  const resolvedConfirmLabel = confirmLabel ?? `Delete ${itemType}`;

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
            {resolvedTitle}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {resolvedDescription}
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
              {resolvedConfirmLabel}
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

MosaicDeleteConfirmationDialog.displayName = "MosaicDeleteConfirmationDialog";
