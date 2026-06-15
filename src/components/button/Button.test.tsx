/**
 * MosaicButton — RED-first TDD
 *
 * Write tests BEFORE implementation.
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after Button.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// This import will fail on Run 1 (RED) — the file does not exist yet.
// eslint-disable-next-line import/no-unresolved
import { MosaicButton } from "./Button.js";

describe("MosaicButton", () => {
  it("renders with role=button", () => {
    render(<MosaicButton>Click me</MosaicButton>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeTruthy();
  });

  it("applies default variant class", () => {
    render(<MosaicButton>Default</MosaicButton>);
    const btn = screen.getByRole("button");
    // default variant carries bg-foreground
    expect(btn.className).toContain("bg-foreground");
  });

  it("applies secondary variant class", () => {
    render(<MosaicButton variant="secondary">Secondary</MosaicButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-secondary");
  });

  it("applies ghost variant class", () => {
    render(<MosaicButton variant="ghost">Ghost</MosaicButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("hover:bg-muted");
  });

  it("applies destructive variant class", () => {
    render(<MosaicButton variant="destructive">Delete</MosaicButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-destructive");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<MosaicButton onClick={handleClick}>Press</MosaicButton>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("forwards ref to the underlying button element", () => {
    const ref = { current: null as HTMLElement | null };
    render(<MosaicButton ref={ref as React.RefObject<HTMLElement>}>Ref test</MosaicButton>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("button");
  });

  it("sets data-slot='button' attribute", () => {
    render(<MosaicButton>Slot</MosaicButton>);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("data-slot")).toBe("button");
  });

  it("is disabled when disabled prop is set", () => {
    render(<MosaicButton disabled>Disabled</MosaicButton>);
    const btn = screen.getByRole("button");
    // @base-ui sets aria-disabled when focusableWhenDisabled; for standard
    // disabled we check the native disabled attribute
    expect(
      btn.getAttribute("disabled") !== undefined ||
        btn.getAttribute("aria-disabled") === "true" ||
        (btn as HTMLButtonElement).disabled,
    ).toBeTruthy();
  });

  it("renders children correctly", () => {
    render(<MosaicButton>Hello world</MosaicButton>);
    expect(screen.getByText("Hello world")).toBeTruthy();
  });
});
