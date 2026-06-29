/**
 * MosaicCheckbox — @base-ui/react Checkbox primitive
 *
 * Builds on Checkbox.Root + Checkbox.Indicator.
 * Supports controlled (checked + onCheckedChange) and uncontrolled modes.
 * Indeterminate state supported via checked="mixed".
 * role=checkbox and aria-checked managed by the primitive automatically.
 *
 * data-slot="checkbox" on Root, "checkbox-indicator" on Indicator.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Checkbox } from "@base-ui/react/checkbox";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicCheckboxProps extends Checkbox.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicCheckbox — production Checkbox atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/checkbox. Supports controlled + uncontrolled + indeterminate.
 * role=checkbox + aria-checked managed automatically by the primitive.
 *
 * @example
 * <MosaicCheckbox aria-label="Accept terms" defaultChecked />
 * <MosaicCheckbox checked={agreed} onCheckedChange={setAgreed} />
 * <MosaicCheckbox checked="mixed" aria-label="Select all" />
 */
export function MosaicCheckbox({ className, ref, ...props }: MosaicCheckboxProps) {
  return (
    <Checkbox.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 cursor-pointer",
        "rounded-sm border border-border bg-background",
        "outline-none transition-colors",
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        // Checked state
        "data-[checked]:border-foreground data-[checked]:bg-foreground",
        // Indeterminate
        "data-[indeterminate]:border-foreground data-[indeterminate]:bg-foreground",
        // Disabled
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <Checkbox.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-background"
      >
        {/* Checkmark icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

MosaicCheckbox.displayName = "MosaicCheckbox";
