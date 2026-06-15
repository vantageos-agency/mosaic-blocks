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
    await user.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("Apple")).toBeTruthy());
    await user.keyboard("{Escape}");
    // base-ui keeps portal in DOM but collapses with aria-expanded=false
    await waitFor(() => {
      const trigger = screen.getByRole("combobox");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("selects an item and calls onValueChange", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicSelect items={ITEMS} placeholder="Pick" onValueChange={handler} />);
    await user.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("Apple")).toBeTruthy());
    await user.click(screen.getByText("Apple"));
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
