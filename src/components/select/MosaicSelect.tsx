/**
 * MosaicSelect — @base-ui/react Select primitive
 *
 * Builds on Select.Root / Trigger / Value / Portal / Positioner / Popup / Item.
 * Props: items[], value, onValueChange, placeholder.
 *
 * data-slot="select" on Trigger, "select-popup" on Popup.
 * Items render with role=option (managed by base-ui).
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Select } from "@base-ui/react/select";
import * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSelectItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MosaicSelectProps {
  /** List of options to display */
  items: MosaicSelectItem[];
  /** Controlled value */
  value?: string;
  /** Callback when value changes. Receives null when selection is cleared. */
  onValueChange?: (value: string | null) => void;
  /** Placeholder text shown when no item is selected */
  placeholder?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSelect — production Select atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/select. Keyboard-accessible, portal-rendered popup.
 * Accepts a flat items[] array for simplicity over the compound pattern.
 *
 * @example
 * <MosaicSelect
 *   items={[{ value: "a", label: "Option A" }]}
 *   placeholder="Pick one"
 *   onValueChange={(v) => console.log(v)}
 * />
 */
export function MosaicSelect({
  items,
  value,
  onValueChange,
  placeholder = "Select…",
  defaultValue,
  disabled,
  required,
  name,
  className,
}: MosaicSelectProps) {
  // Build value→label lookup so Select.Value renders the label, not the raw value
  const labelMap = React.useMemo(
    () => Object.fromEntries(items.map((item) => [item.value, item.label])),
    [items],
  );

  return (
    <Select.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      name={name}
    >
      <Select.Trigger
        data-slot="select"
        className={cn(
          "inline-flex h-9 w-full min-w-[8rem] items-center justify-between gap-2",
          "rounded-md border border-border bg-background px-3 py-2",
          "text-sm text-foreground shadow-xs outline-none",
          "hover:bg-muted",
          "focus-visible:ring-ring focus-visible:ring-[3px]",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          "data-[popup-open]:ring-ring data-[popup-open]:ring-[3px]",
          className,
        )}
      >
        <Select.Value placeholder={placeholder}>
          {(val: string | null) => (val != null && val in labelMap ? labelMap[val] : placeholder)}
        </Select.Value>
        <Select.Icon className="size-4 shrink-0 text-muted-foreground">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={4}>
          <Select.Popup
            data-slot="select-popup"
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border",
              "bg-popover p-1 text-popover-foreground shadow-md",
              "origin-[var(--transform-origin)]",
              "transition-[transform,scale,opacity]",
              "data-[open]:scale-100 data-[open]:opacity-100",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            )}
          >
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5",
                    "text-sm text-popover-foreground outline-none",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                    "data-[selected]:font-medium",
                  )}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto size-4">
                    <CheckIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

// ── Icons (inline SVG — zero dependency) ──────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
