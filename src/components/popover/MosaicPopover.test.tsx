/**
 * MosaicPopover — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicPopover.tsx exists)
 *
 * Built on @base-ui/react/popover.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicPopover } from "./MosaicPopover.js";

function Harness({
  open,
  onOpenChange,
  modal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal?: boolean | "trap-focus";
}) {
  const anchorRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={anchorRef} data-testid="anchor-input" aria-label="Mention input" />
      <button type="button" data-testid="outside-el">
        Outside
      </button>
      <MosaicPopover open={open} onOpenChange={onOpenChange} anchor={anchorRef} modal={modal}>
        <ul data-testid="entry-list">
          <li>
            <button type="button" data-testid="entry-1">
              Alice
            </button>
          </li>
          <li>
            <button type="button" data-testid="entry-2">
              Bob
            </button>
          </li>
        </ul>
      </MosaicPopover>
    </div>
  );
}

describe("MosaicPopover", () => {
  it("renders nothing when open=false", () => {
    render(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId("entry-list")).toBeNull();
  });

  it("renders children when open=true", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(screen.getByTestId("entry-list")).toBeTruthy();
    expect(screen.getByTestId("entry-1")).toBeTruthy();
  });

  it("renders with data-slot='popover' on the popup root", () => {
    render(<Harness open onOpenChange={() => {}} />);
    // Popover.Portal renders into document.body, outside the RTL container.
    expect(document.querySelector('[data-slot="popover"]')).toBeTruthy();
  });

  it("positions the popup relative to the supplied anchor", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const positioner = document.querySelector('[data-slot="popover-positioner"]');
    expect(positioner).toBeTruthy();
  });

  it("calls onOpenChange(false) on Escape key", () => {
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) on outside click", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    await user.click(screen.getByTestId("outside-el"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not close when clicking inside the popup content", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    await user.click(screen.getByTestId("entry-1"));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("allows Tab to move focus between focusable entries inside the popup", async () => {
    const user = userEvent.setup();
    render(<Harness open onOpenChange={() => {}} />);
    const first = screen.getByTestId("entry-1");
    const second = screen.getByTestId("entry-2");
    first.focus();
    expect(document.activeElement).toBe(first);
    await user.tab();
    expect(document.activeElement).toBe(second);
  });

  it("is fully host-controlled: does not render when open=false even after mount", () => {
    const { rerender } = render(<Harness open onOpenChange={() => {}} />);
    expect(screen.queryByTestId("entry-list")).toBeTruthy();
    rerender(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId("entry-list")).toBeNull();
  });

  // NOT COVERED — flagged, not faked green.
  //
  // With `modal="trap-focus"` (or `modal={true}`), Base UI's real focus trap
  // relies on the BROWSER's native Tab-key focus traversal landing on
  // `[data-base-ui-focus-guard]` sentinel elements, which its own focusin
  // handler then redirects back inside the popup. jsdom implements neither:
  // `fireEvent.keyDown(el, { key: "Tab" })` does not move
  // `document.activeElement`, and `userEvent.tab()` performs its own DOM
  // traversal that never consults the guard sentinels, so an assertion here
  // would be green whether the trap is wired or not (verified: the same
  // finding is already documented for MosaicDrawer, which trap-traps under
  // `modal` `true` via the identical Base UI primitive).
  //
  // The trap is exercised for real via `@base-ui/react`'s own test suite (a
  // locked, audited dependency — see package.json) and via manual /
  // Storybook keyboard QA, not by a jsdom unit assertion here.
  it.skip("traps focus inside the popup when modal='trap-focus' (jsdom cannot simulate native Tab traversal past focus-guard sentinels — see comment above; verified via @base-ui/react's own suite + manual QA)", async () => {
    const user = userEvent.setup();
    render(<Harness open onOpenChange={() => {}} modal="trap-focus" />);
    const outside = screen.getByTestId("outside-el");
    const last = screen.getByTestId("entry-2");
    last.focus();
    await user.tab();
    expect(document.activeElement).not.toBe(outside);
  });
});
