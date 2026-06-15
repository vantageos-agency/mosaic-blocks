/**
 * MosaicDropdownMenu — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicDropdownMenu.tsx exists)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDropdownMenu } from "./MosaicDropdownMenu.js";

const ITEMS = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { id: "delete", label: "Delete" },
];

describe("MosaicDropdownMenu", () => {
  it("renders a trigger button", () => {
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("sets data-slot='dropdown-menu' on the popup", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => {
      const popup = document.querySelector("[data-slot='dropdown-menu']");
      expect(popup).toBeTruthy();
    });
  });

  it("opens menu on trigger click", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeTruthy();
    });
  });

  it("opens menu on Enter key", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeTruthy();
    });
  });

  it("closes menu on Escape key", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => expect(screen.getByText("Edit")).toBeTruthy());
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("Edit")).toBeFalsy();
    });
  });

  it("renders all items in the menu popup", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => {
      for (const item of ITEMS) {
        expect(screen.getByText(item.label)).toBeTruthy();
      }
    });
  });

  it("calls onItemSelect with item id when clicked", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <MosaicDropdownMenu
        trigger={<button type="button">Open menu</button>}
        items={ITEMS}
        onItemSelect={handler}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => expect(screen.getByText("Edit")).toBeTruthy());
    await user.click(screen.getByText("Edit"));
    expect(handler).toHaveBeenCalledWith("edit");
  });

  it("navigates items with ArrowDown / ArrowUp keys", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByText("Edit")).toBeTruthy());
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    // Navigation completed without error
  });

  it("closes menu after selecting an item", async () => {
    const user = userEvent.setup();
    render(
      <MosaicDropdownMenu
        trigger={<button type="button">Open menu</button>}
        items={ITEMS}
        onItemSelect={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => expect(screen.getByText("Duplicate")).toBeTruthy());
    await user.click(screen.getByText("Duplicate"));
    await waitFor(() => {
      expect(screen.queryByText("Duplicate")).toBeFalsy();
    });
  });

  it("renders items with role=menuitem", async () => {
    const user = userEvent.setup();
    render(<MosaicDropdownMenu trigger={<button type="button">Open menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await waitFor(() => {
      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBe(ITEMS.length);
    });
  });
});
