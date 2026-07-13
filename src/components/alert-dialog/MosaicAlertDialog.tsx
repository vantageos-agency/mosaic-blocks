"use client";

/**
 * MosaicAlertDialog — confirm-before-irreversible-action dialog (compound API)
 *
 * Ported from any-debate-ai components/ui/alert-dialog.tsx
 * (source: gh api repos/elpiarthera/any-debate-ai/contents/components/ui/alert-dialog.tsx)
 *
 * Radix (`@radix-ui/react-alert-dialog`) replaced with `@base-ui/react/alert-dialog`
 * per ADR-0001 — deps locked to @base-ui/react + class-variance-authority, no
 * radix, no vaul. `buttonVariants` from the shadcn source replaced with local
 * button-like classes (kept in-file to avoid a hard dependency between two
 * public components — MosaicButton is a separate export).
 *
 * Zero branding, zero copy: every visible string is a REQUIRED prop with no
 * default (SIN-01) — Title/Description/Cancel/Action are compound
 * components whose `children` is the required string; there is no `??`, no
 * `||`, no default-parameter fallback anywhere in this file.
 *
 * Accessibility (the reason this component exists — a human must be able to
 * say no):
 * - `role="alertdialog"` is set automatically by @base-ui/react/alert-dialog
 *   (AlertDialog.Root sets it, distinct from the plain "dialog" role).
 * - `aria-labelledby` / `aria-describedby` are wired automatically by
 *   @base-ui/react from Title / Description element ids.
 * - Focus trap: @base-ui/react/alert-dialog Popup traps Tab within the popup.
 * - Escape closes and is treated as CANCEL, never as confirm — Escape only
 *   ever calls `onOpenChange(false)`, it never calls the confirm handler.
 * - Focus returns to the trigger element on close (Popup `finalFocus`
 *   default behavior).
 * - The destructive action is never the default focus target: DOM order
 *   places MosaicAlertDialogCancel before MosaicAlertDialogAction, and
 *   @base-ui/react's default `initialFocus` picks the FIRST tabbable element
 *   in the popup — i.e. Cancel. A reflex Enter never destroys anything.
 */

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type * as React from "react";
import { alertDialogContentVariants, alertDialogOverlayVariants } from "./alert-dialog-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Root / Trigger / Portal ──────────────────────────────────────────────────

export function MosaicAlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}
MosaicAlertDialog.displayName = "MosaicAlertDialog";

export function MosaicAlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}
MosaicAlertDialogTrigger.displayName = "MosaicAlertDialogTrigger";

export function MosaicAlertDialogPortal(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>,
) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}
MosaicAlertDialogPortal.displayName = "MosaicAlertDialogPortal";

// ── Overlay ───────────────────────────────────────────────────────────────────

export interface MosaicAlertDialogOverlayProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Backdrop> {
  className?: string;
}

export function MosaicAlertDialogOverlay({ className, ...props }: MosaicAlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(alertDialogOverlayVariants(), className)}
      {...props}
    />
  );
}
MosaicAlertDialogOverlay.displayName = "MosaicAlertDialogOverlay";

// ── Content ───────────────────────────────────────────────────────────────────

export interface MosaicAlertDialogContentProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Popup> {
  className?: string;
}

export function MosaicAlertDialogContent({ className, ...props }: MosaicAlertDialogContentProps) {
  return (
    <MosaicAlertDialogPortal>
      <MosaicAlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(alertDialogContentVariants(), className)}
        {...props}
      />
    </MosaicAlertDialogPortal>
  );
}
MosaicAlertDialogContent.displayName = "MosaicAlertDialogContent";

// ── Header / Footer ──────────────────────────────────────────────────────────

export function MosaicAlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}
MosaicAlertDialogHeader.displayName = "MosaicAlertDialogHeader";

export function MosaicAlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
MosaicAlertDialogFooter.displayName = "MosaicAlertDialogFooter";

// ── Title / Description ──────────────────────────────────────────────────────

export interface MosaicAlertDialogTitleProps
  extends Omit<React.ComponentProps<typeof AlertDialogPrimitive.Title>, "children"> {
  className?: string;
  /** Dialog title text. Required — the host owns the language, no default. */
  children: React.ReactNode;
}

export function MosaicAlertDialogTitle({
  className,
  children,
  ...props
}: MosaicAlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Title>
  );
}
MosaicAlertDialogTitle.displayName = "MosaicAlertDialogTitle";

export interface MosaicAlertDialogDescriptionProps
  extends Omit<React.ComponentProps<typeof AlertDialogPrimitive.Description>, "children"> {
  className?: string;
  /** Dialog description text. Required — the host owns the language, no default. */
  children: React.ReactNode;
}

export function MosaicAlertDialogDescription({
  className,
  children,
  ...props
}: MosaicAlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Description>
  );
}
MosaicAlertDialogDescription.displayName = "MosaicAlertDialogDescription";

// ── Action / Cancel ───────────────────────────────────────────────────────────
//
// DOM order matters for accessibility: Cancel MUST be rendered before Action
// so that @base-ui/react's default `initialFocus` (first tabbable element)
// lands on Cancel, never on the destructive Action. See MosaicAlertDialogFooter
// usage guidance in the stories/README — Cancel first, Action second.

export interface MosaicAlertDialogActionProps
  extends Omit<React.ComponentProps<typeof AlertDialogPrimitive.Close>, "children"> {
  className?: string;
  /** Confirm button label. Required — the host owns the language, no default. */
  children: React.ReactNode;
}

export function MosaicAlertDialogAction({
  className,
  children,
  ...props
}: MosaicAlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4",
        "bg-destructive text-sm font-medium text-destructive-foreground",
        "hover:bg-destructive/90",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Close>
  );
}
MosaicAlertDialogAction.displayName = "MosaicAlertDialogAction";

export interface MosaicAlertDialogCancelProps
  extends Omit<React.ComponentProps<typeof AlertDialogPrimitive.Close>, "children"> {
  className?: string;
  /** Cancel button label. Required — the host owns the language, no default. */
  children: React.ReactNode;
}

export function MosaicAlertDialogCancel({
  className,
  children,
  ...props
}: MosaicAlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4",
        "bg-background text-sm font-medium text-foreground shadow-xs",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Close>
  );
}
MosaicAlertDialogCancel.displayName = "MosaicAlertDialogCancel";
