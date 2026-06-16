/**
 * MosaicInput — built on @base-ui/react/input
 *
 * Uses the Input primitive from @base-ui/react/input which renders a native
 * <input> element with Field integration and ref-as-prop (React 19).
 * data-slot="input".
 *
 * Design tokens: Tailwind v4 semantic classes (bg-background, border-border,
 * text-foreground, ring-ring). No hardcoded colors.
 */

import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicInputProps extends InputPrimitive.Props {
  className?: string;
}

/**
 * MosaicInput — accessible text input built on @base-ui/react Input.
 *
 * Forwards ref to the underlying <input> element.
 * Accepts all standard input props plus className.
 *
 * @example
 * <MosaicInput placeholder="Search…" />
 * <MosaicInput type="email" value={email} onChange={handleChange} />
 */
export function MosaicInput({ className, ref, ...props }: MosaicInputProps) {
  return (
    <InputPrimitive
      ref={ref as React.Ref<HTMLElement>}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1",
        "text-sm text-foreground shadow-xs",
        "placeholder:text-muted-foreground",
        "outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

MosaicInput.displayName = "MosaicInput";
