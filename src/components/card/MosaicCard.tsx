/**
 * MosaicCard — style-only composable Card atom
 *
 * Composable sub-parts: Card + CardHeader + CardTitle + CardDescription +
 * CardContent + CardFooter. Plain <div>s with data-slot attributes.
 * No base-ui primitive needed — purely presentational.
 *
 * Design tokens: Tailwind v4 semantic classes only (bg-card, text-card-foreground,
 * border-border). No hardcoded colors.
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── MosaicCard ────────────────────────────────────────────────────────────────

export interface MosaicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * MosaicCard — root container with rounded border and background.
 *
 * @example
 * <MosaicCard>
 *   <MosaicCardHeader>…</MosaicCardHeader>
 *   <MosaicCardContent>…</MosaicCardContent>
 *   <MosaicCardFooter>…</MosaicCardFooter>
 * </MosaicCard>
 */
export function MosaicCard({ className, ref, ...props }: MosaicCardProps) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

MosaicCard.displayName = "MosaicCard";

// ── MosaicCardHeader ──────────────────────────────────────────────────────────

export interface MosaicCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function MosaicCardHeader({ className, ref, ...props }: MosaicCardHeaderProps) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  );
}

MosaicCardHeader.displayName = "MosaicCardHeader";

// ── MosaicCardTitle ───────────────────────────────────────────────────────────

export interface MosaicCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  ref?: React.Ref<HTMLHeadingElement>;
}

export function MosaicCardTitle({ className, ref, ...props }: MosaicCardTitleProps) {
  return (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

MosaicCardTitle.displayName = "MosaicCardTitle";

// ── MosaicCardDescription ─────────────────────────────────────────────────────

export interface MosaicCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  ref?: React.Ref<HTMLParagraphElement>;
}

export function MosaicCardDescription({ className, ref, ...props }: MosaicCardDescriptionProps) {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

MosaicCardDescription.displayName = "MosaicCardDescription";

// ── MosaicCardContent ─────────────────────────────────────────────────────────

export interface MosaicCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function MosaicCardContent({ className, ref, ...props }: MosaicCardContentProps) {
  return (
    <div ref={ref} data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />
  );
}

MosaicCardContent.displayName = "MosaicCardContent";

// ── MosaicCardFooter ──────────────────────────────────────────────────────────

export interface MosaicCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function MosaicCardFooter({ className, ref, ...props }: MosaicCardFooterProps) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

MosaicCardFooter.displayName = "MosaicCardFooter";
