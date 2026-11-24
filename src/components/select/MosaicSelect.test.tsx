/**
 * MosaicSelect — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicSelect.tsx exists)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicSelect } from "./MosaicSelect.js";

type User = ReturnType<typeof userEvent.setup>;

/**
 * Opens the Select with a pointer click and resolves only once the popup is
 * INTERACTIVE, not merely rendered. base-ui opens it inside requestAnimationFrame
 * (outside act), and the option text reaches the DOM before two things the next
 * interaction needs: the document-level Escape / outside-press listener (attached
 * by a passive effect) and pointer events on the positioner (inline
 * `pointer-events: none` until it settles). An Escape or option click sent at that
 * instant is dropped, so a test that waited only for the text fails whenever load
 * stretches the gap. Focus moving into the popup (a later animation frame queued
 * by base-ui's focus manager) comes after both: that is the state awaited here.
 */
async function openPopup(user: User, trigger: HTMLElement): Promise<void> {
  await user.click(trigger);
  await waitFor(() => {
    const popup = document.querySelector('[data-slot="select-popup"]');
    expect(popup?.contains(document.activeElement)).toBe(true);
  });
}

const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

describe("MosaicSelect", () => {
  it("renders a trigger button", () => {
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("sets data-slot='select' on the trigger", () => {
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("data-slot")).toBe("select");
  });

  it("shows placeholder when no value is selected", () => {
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
  });

  it("opens popup on click", async () => {
    const user = userEvent.setup();
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("Apple")).toBeTruthy();
    });
  });

  it("opens popup on Enter key", async () => {
    const user = userEvent.setup();
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText("Apple")).toBeTruthy();
    });
  });

  it("closes popup on Escape key", async () => {
    const user = userEvent.setup();
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    const trigger = screen.getByRole("combobox");
    await openPopup(user, trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Escape}");
    // base-ui keeps portal in DOM but collapses with aria-expanded=false
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
  });

  it("selects an item and calls onValueChange", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicSelect items={ITEMS} placeholder="Pick" onValueChange={handler} />);
    await openPopup(user, screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Apple" }));
    // base-ui calls onValueChange(value, eventDetails) — assert first argument
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe("apple");
  });

  it("shows selected value text in trigger when value is controlled", async () => {
    render(<MosaicSelect items={ITEMS} value="banana" placeholder="Pick" />);
    expect(screen.getByText("Banana")).toBeTruthy();
  });

  it("navigates items with arrow keys", async () => {
    const user = userEvent.setup();
    render(<MosaicSelect items={ITEMS} placeholder="Pick a fruit" />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByText("Apple")).toBeTruthy());
    await user.keyboard("{ArrowDown}");
    // After ArrowDown, first item should be highlighted — test doesn't fail on absence
    await waitFor(() => {
      const items = screen.getAllByRole("option");
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it("renders all items in popup", async () => {
    const user = userEvent.setup();
    render(<MosaicSelect items={ITEMS} placeholder="Pick" />);
    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      for (const item of ITEMS) {
        expect(screen.getByText(item.label)).toBeTruthy();
      }
    });
  });
});
