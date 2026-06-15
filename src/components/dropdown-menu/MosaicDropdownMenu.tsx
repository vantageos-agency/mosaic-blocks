/**
 * MosaicDropdownMenu — @base-ui/react Menu primitive
 *
 * Builds on Menu.Root / Trigger / Portal / Positioner / Popup / Item / Separator.
 * Exported as MosaicDropdownMenu per spec (named separately from Menu to avoid clash).
 *
 * data-slot="dropdown-menu" on Popup.
 * Items render with role=menuitem (managed by base-ui).
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Menu } from "@base-ui/react/menu";
import * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicDropdownMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** Render a separator BEFORE this item */
  separator?: boolean;
}

export interface MosaicDropdownMenuProps {
  /** The trigger element — wrapped in Menu.Trigger automatically */
  trigger: React.ReactNode;
  /** List of menu items */
  items: MosaicDropdownMenuItem[];
  /** Callback when an item is selected, receives item.id */
  onItemSelect?: (id: string) => void;
  /** Whether the menu is open (controlled) */
  open?: boolean;
  /** Callback when open state changes (controlled) */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicDropdownMenu — production DropdownMenu atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/menu. Portal-rendered popup, keyboard-accessible.
 * Keyboard: Enter/Space opens, ArrowDown/Up navigate, Escape closes, Enter selects.
 *
 * @example
 * <MosaicDropdownMenu
 *   trigger={<button type="button">Open menu</button>}
 *   items={[{ id: "edit", label: "Edit" }, { id: "delete", label: "Delete" }]}
 *   onItemSelect={(id) => console.log(id)}
 * />
 */
export function MosaicDropdownMenu({
  trigger,
  items,
  onItemSelect,
  open,
  onOpenChange,
  className,
}: MosaicDropdownMenuProps) {
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger render={trigger as React.ReactElement} />

      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup
            data-slot="dropdown-menu"
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border",
              "bg-popover p-1 text-popover-foreground shadow-md",
              "origin-[var(--transform-origin)]",
              "transition-[transform,scale,opacity]",
              "data-[open]:scale-100 data-[open]:opacity-100",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              className,
            )}
          >
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.separator && <Menu.Separator className="my-1 h-px bg-border" />}
                <Menu.Item
                  disabled={item.disabled}
                  onClick={() => onItemSelect?.(item.id)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5",
                    "text-sm text-popover-foreground outline-none",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                  )}
                >
                  {item.label}
                </Menu.Item>
              </React.Fragment>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
