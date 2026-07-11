/**
 * MosaicCombobox — @base-ui/react Combobox primitive
 *
 * Path taken: @base-ui/react/combobox (NATIVE in @base-ui/react@1.5.0 — confirmed present).
 * The `combobox` subpath exports Combobox.Root / Input / Trigger / Portal /
 * Positioner / Popup / List / Item / Empty / useFilter.
 *
 * Props: items[], value, onValueChange, placeholder.
 * Filtering: built-in useFilter from @base-ui/react/combobox with "contains" strategy.
 *
 * data-slot="combobox" on the wrapper div.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Combobox } from "@base-ui/react/combobox";
import * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MosaicComboboxProps {
  /** List of options */
  items: MosaicComboboxItem[];
  /** Controlled selected value */
  value?: string;
  /** Callback when selected value changes. Receives null when selection is cleared. */
  onValueChange?: (value: string | null) => void;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Input placeholder */
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  /**
   * Message shown when no item matches the filter. Required — the host
   * owns the language (e.g. `t('Combobox.empty')`). No default, no fallback.
   */
  emptyMessage: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicCombobox — production Combobox atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/combobox (native in 1.5.0).
 * Filtering via built-in useFilter with "contains" strategy.
 * Keyboard-accessible: ArrowDown/Up navigate, Enter selects, Escape closes.
 *
 * @example
 * <MosaicCombobox
 *   items={[{ value: "ts", label: "TypeScript" }]}
 *   placeholder="Search…"
 *   onValueChange={(v) => console.log(v)}
 *   emptyMessage={t('Combobox.empty')}
 * />
 */
export function MosaicCombobox({
  items,
  value,
  onValueChange,
  defaultValue,
  placeholder = "Search…",
  disabled,
  name,
  emptyMessage,
  className,
}: MosaicComboboxProps) {
  const [inputValue, setInputValue] = React.useState("");

  const filter = Combobox.useFilter({ sensitivity: "base" });

  const filteredItems = React.useMemo(() => {
    if (!inputValue) return items;
    return items.filter((item) => filter.contains(item.label, inputValue));
  }, [items, inputValue, filter]);

  return (
    <Combobox.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onInputValueChange={setInputValue}
      autoHighlight
    >
      <div data-slot="combobox" className={cn("relative w-full", className)}>
        <Combobox.Input
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-md border border-border bg-background px-3 py-2",
            "text-sm text-foreground shadow-xs outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:ring-ring focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup
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
              <Combobox.List>
                {filteredItems.map((item) => (
                  <Combobox.Item
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
                    {item.label}
                  </Combobox.Item>
                ))}
                <Combobox.Empty className="py-2 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </Combobox.Empty>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}
