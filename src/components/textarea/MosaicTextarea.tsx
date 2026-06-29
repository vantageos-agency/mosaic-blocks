/**
 * MosaicTextarea — native <textarea> styled atom
 *
 * No @base-ui/react primitive for textarea — uses the native HTML element.
 * Consistent token vocabulary with MosaicInput.
 *
 * data-slot="textarea" on the rendered <textarea>.
 * Styling: Tailwind v4 semantic tokens only.
 */

import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTextarea — production Textarea atom for @vantageos/mosaic-blocks.
 *
 * Styled native <textarea>. Matches MosaicInput visual vocabulary.
 * Resize: vertical only by default.
 *
 * @example
 * <MosaicTextarea placeholder="Describe your idea…" rows={4} />
 * <MosaicTextarea disabled value="Read-only text" readOnly />
 */
export function MosaicTextarea({ className, ref, ...props }: MosaicTextareaProps) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full resize-y",
        "rounded-md border border-border bg-background px-3 py-2",
        "text-sm text-foreground shadow-xs",
        "placeholder:text-muted-foreground",
        "outline-none transition-colors",
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

MosaicTextarea.displayName = "MosaicTextarea";
