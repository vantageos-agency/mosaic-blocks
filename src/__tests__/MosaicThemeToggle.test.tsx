/**
 * MosaicThemeToggle — RED-first tests
 * Contract: renders; clicking flips data-theme on document root; fires onChange
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MosaicThemeToggle } from "../components/theme-toggle/MosaicThemeToggle.js";

describe("MosaicThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders without crashing", () => {
    const { unmount } = render(<MosaicThemeToggle />);
    unmount();
  });

  it("renders a toggle button", () => {
    render(<MosaicThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toBeTruthy();
  });

  it("flips data-theme on the document root when clicked", () => {
    render(<MosaicThemeToggle />);
    const btn = screen.getByRole("button");
    // Initial click — sets to dark
    fireEvent.click(btn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    // Second click — back to light
    fireEvent.click(btn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("fires onChange with the new theme", () => {
    const onChange = vi.fn();
    render(<MosaicThemeToggle onChange={onChange} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
