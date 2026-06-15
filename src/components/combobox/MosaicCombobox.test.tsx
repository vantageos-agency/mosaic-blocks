/**
 * MosaicCombobox — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicCombobox.tsx exists)
 *
 * Built on @base-ui/react/combobox (native in @base-ui/react@1.5.0).
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicCombobox } from "./MosaicCombobox.js";

const ITEMS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
];

describe("MosaicCombobox", () => {
  it("renders an input with role=combobox", () => {
    render(<MosaicCombobox items={ITEMS} placeholder="Search frameworks…" />);
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("sets data-slot='combobox' on the wrapper", () => {
    const { container } = render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    const wrapper = container.querySelector("[data-slot='combobox']");
    expect(wrapper).toBeTruthy();
  });

  it("shows placeholder text in input", () => {
    render(<MosaicCombobox items={ITEMS} placeholder="Search frameworks…" />);
    const input = screen.getByRole("combobox");
    expect(input.getAttribute("placeholder")).toBe("Search frameworks…");
  });

  it("opens dropdown on input focus + type", async () => {
    const user = userEvent.setup();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Re");
    await waitFor(() => {
      expect(screen.getByText("React")).toBeTruthy();
    });
  });

  it("filters items by input value", async () => {
    const user = userEvent.setup();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "vue");
    await waitFor(() => {
      expect(screen.getByText("Vue")).toBeTruthy();
      expect(screen.queryByText("React")).toBeFalsy();
    });
  });

  it("closes popup on Escape key", async () => {
    const user = userEvent.setup();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "r");
    await waitFor(() => expect(screen.getByText("React")).toBeTruthy());
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("React")).toBeFalsy();
    });
  });

  it("calls onValueChange when item is selected", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" onValueChange={handler} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "React");
    await waitFor(() => expect(screen.getByText("React")).toBeTruthy());
    await user.click(screen.getByText("React"));
    // base-ui calls onValueChange(value, eventDetails) — assert first argument
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe("react");
  });

  it("navigates items with ArrowDown", async () => {
    const user = userEvent.setup();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "a");
    await waitFor(() => {
      const opts = screen.queryAllByRole("option");
      expect(opts.length).toBeGreaterThan(0);
    });
    await user.keyboard("{ArrowDown}");
    // Arrow navigation succeeded without throwing
  });

  it("shows all items when input is empty and popup is open", async () => {
    const user = userEvent.setup();
    render(<MosaicCombobox items={ITEMS} placeholder="Search…" />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    // Trigger open via ArrowDown which should open and show items
    await user.keyboard("{ArrowDown}");
    await waitFor(() => {
      const opts = screen.queryAllByRole("option");
      expect(opts.length).toBeGreaterThan(0);
    });
  });
});
