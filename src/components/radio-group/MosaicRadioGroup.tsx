/**
 * MosaicRadioGroup — @base-ui/react RadioGroup + Radio primitives
 *
 * Builds on RadioGroup (from @base-ui/react/radio-group) +
 * Radio.Root + Radio.Indicator (from @base-ui/react/radio).
 * Supports controlled (value + onValueChange) and uncontrolled modes.
 * role=radiogroup + role=radio + aria-checked managed by primitives automatically.
 *
 * data-slot="radio-group" on RadioGroup, "radio" on Radio.Root,
 * "radio-indicator" on Radio.Indicator.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicRadioGroupProps extends RadioGroup.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicRadioGroupItemProps extends Radio.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
}

// ── Components ────────────────────────────────────────────────────────────────

/**
 * MosaicRadioGroup — production RadioGroup for @vantageos/mosaic-blocks.
 *
 * Wrap with MosaicRadioGroupItem for each option.
 * role=radiogroup is set automatically by the primitive.
 *
 * @example
 * <MosaicRadioGroup value={plan} onValueChange={setPlan} aria-label="Plan">
 *   <MosaicRadioGroupItem value="free">Free</MosaicRadioGroupItem>
 *   <MosaicRadioGroupItem value="pro">Pro</MosaicRadioGroupItem>
 * </MosaicRadioGroup>
 */
export function MosaicRadioGroup({ className, ref, ...props }: MosaicRadioGroupProps) {
  return (
    <RadioGroup
      ref={ref}
      data-slot="radio-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

MosaicRadioGroup.displayName = "MosaicRadioGroup";

/**
 * MosaicRadioGroupItem — individual radio button for MosaicRadioGroup.
 *
 * @example
 * <MosaicRadioGroupItem value="option-a">Option A</MosaicRadioGroupItem>
 */
export function MosaicRadioGroupItem({
  className,
  children,
  ref,
  ...props
}: MosaicRadioGroupItemProps) {
  return (
    <Radio.Root
      ref={ref}
      data-slot="radio"
      className={cn(
        "flex items-center gap-2 text-sm font-medium",
        "cursor-pointer select-none",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {/* Radio button circle */}
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center",
          "rounded-full border border-border bg-background",
          "outline-none transition-colors",
          "focus-visible:ring-ring focus-visible:ring-[3px]",
          "peer-data-[checked]:border-foreground",
        )}
      >
        <Radio.Indicator data-slot="radio-indicator" className="flex items-center justify-center">
          <span className="size-2 rounded-full bg-foreground" />
        </Radio.Indicator>
      </span>
      {children}
    </Radio.Root>
  );
}

MosaicRadioGroupItem.displayName = "MosaicRadioGroupItem";
