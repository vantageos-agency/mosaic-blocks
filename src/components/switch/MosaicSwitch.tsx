/**
 * MosaicSwitch — @base-ui/react Switch primitive
 *
 * Builds on Switch.Root + Switch.Thumb.
 * Supports controlled (checked + onCheckedChange) and uncontrolled (defaultChecked).
 * role=switch and aria-checked are managed by the primitive automatically.
 *
 * data-slot="switch" on Root, data-slot="switch-thumb" on Thumb.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Switch } from "@base-ui/react/switch";
import * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicSwitchProps extends React.ComponentPropsWithoutRef<typeof Switch.Root> {
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSwitch — production Switch atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/switch. Supports controlled + uncontrolled modes.
 * role=switch + aria-checked managed automatically by the primitive.
 *
 * @example
 * // Uncontrolled
 * <MosaicSwitch aria-label="Dark mode" defaultChecked />
 *
 * // Controlled
 * <MosaicSwitch checked={enabled} onCheckedChange={setEnabled} aria-label="Notifications" />
 */
export const MosaicSwitch = React.forwardRef<HTMLElement, MosaicSwitchProps>(function MosaicSwitch(
  { className, ...props },
  ref,
) {
  return (
    <Switch.Root
      ref={ref}
      data-slot="switch"
      className={cn(
        // Track
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center",
        "rounded-full border-2 border-transparent outline-none",
        "bg-muted transition-colors",
        // Checked state — bg-foreground when on
        "data-[checked]:bg-foreground",
        // Focus ring
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        // Disabled
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <Switch.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full",
          "bg-background shadow-sm",
          "translate-x-0 transition-transform",
          "data-[checked]:translate-x-5",
        )}
      />
    </Switch.Root>
  );
});

MosaicSwitch.displayName = "MosaicSwitch";
