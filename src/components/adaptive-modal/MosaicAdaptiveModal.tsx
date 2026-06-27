"use client";

/**
 * MosaicAdaptiveModal — Dialog on desktop, bottom sheet on mobile (PC-03)
 *
 * Ported (source: private upstream) components/adaptive/AdaptiveModal.tsx
 *
 * Implementation: uses native <dialog> element for a11y (keyboard focus trap
 * handled by browser on showModal, Escape auto-closes).
 * - Desktop: centered modal overlay + dialog panel
 * - Mobile: bottom sheet (CSS slide-up)
 *
 * Framer-motion replaced with CSS transitions + @keyframes.
 * Respects prefers-reduced-motion.
 * No Radix/Vaul dependency — lib-portable.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-adaptive-modal-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-modal-in {
      from { opacity: 0; transform: scale(0.96) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes mosaic-sheet-in {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    @keyframes mosaic-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .mosaic-modal-panel {
      animation: mosaic-modal-in 200ms ease-out forwards;
    }
    .mosaic-sheet-panel {
      animation: mosaic-sheet-in 280ms ease-out forwards;
    }
    .mosaic-modal-overlay {
      animation: mosaic-overlay-in 150ms ease-out forwards;
    }
    dialog.mosaic-modal-dialog::backdrop {
      background: transparent;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-modal-panel,
      .mosaic-sheet-panel,
      .mosaic-modal-overlay {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAdaptiveModal — unified modal/sheet. On desktop renders a centered
 * dialog; on mobile renders a bottom-sheet drawer. Single API for both.
 *
 * @example
 * <MosaicAdaptiveModal isOpen={open} onClose={() => setOpen(false)} title="Settings">
 *   <p>Modal body content</p>
 * </MosaicAdaptiveModal>
 */
export function MosaicAdaptiveModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  description,
}: MosaicAdaptiveModalProps) {
  const { isMobile } = useDevice();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    injectStyles();
  }, []);

  // Control native dialog open/close
  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [isOpen]);

  // Native dialog fires 'cancel' on Escape — map to onClose
  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", handler);
    return () => el.removeEventListener("cancel", handler);
  }, [onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle backdrop click: native <dialog> fires click on the dialog element when
  // the user clicks the ::backdrop. We close when the click target IS the dialog itself.
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (isMobile) {
    // Bottom sheet — rendered inside a <dialog>
    return (
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        data-slot="adaptive-modal"
        className="mosaic-modal-dialog m-0 h-full w-full max-w-full border-0 bg-transparent p-0 backdrop:bg-black/50 open:flex open:items-end"
        onClick={handleDialogClick}
        onKeyDown={() => {
          /* Escape handled natively via dialog cancel event */
        }}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation on aria-hidden container is intentional backdrop isolation */}
        <div
          className={cn(
            "mosaic-sheet-panel relative w-full rounded-t-2xl border-t border-border bg-background",
            "max-h-[90dvh] flex flex-col",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
          </div>
          {/* Header */}
          <div className="px-4 pb-3 pt-1 shrink-0 border-b border-border">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-3">{children}</div>
        </div>
      </dialog>
    );
  }

  // Desktop centered modal
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      data-slot="adaptive-modal"
      className="mosaic-modal-dialog fixed inset-0 m-auto border-0 bg-transparent p-0 backdrop:bg-black/50"
      onClick={handleDialogClick}
      onKeyDown={() => {
        /* Escape handled natively via dialog cancel event */
      }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only; keyboard handled by dialog cancel event */}
      <div
        className={cn(
          "mosaic-modal-panel relative w-[min(90vw,42rem)] rounded-xl border border-border bg-background shadow-xl",
          "max-h-[90vh] flex flex-col",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </dialog>
  );
}

MosaicAdaptiveModal.displayName = "MosaicAdaptiveModal";
