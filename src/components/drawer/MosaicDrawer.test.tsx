import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDrawer } from "./MosaicDrawer.js";

function Harness({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div>
      <button type="button" data-testid="outside-trigger">
        Open agent detail
      </button>
      <p data-testid="background-text">List item behind the drawer</p>
      <MosaicDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Agent detail"
        closeAriaLabel="Close drawer"
      >
        <button type="button" data-testid="first-field">
          First field
        </button>
        <button type="button" data-testid="last-field">
          Last field
        </button>
      </MosaicDrawer>
    </div>
  );
}

describe("MosaicDrawer", () => {
  it("renders nothing when open=false", () => {
    render(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Agent detail")).toBeNull();
  });

  it("renders children and title when open=true", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(screen.getByText("Agent detail")).toBeTruthy();
    expect(screen.getByTestId("first-field")).toBeTruthy();
  });

  it("renders with data-slot='drawer' on the popup root", () => {
    render(<Harness open onOpenChange={() => {}} />);
    // Dialog.Portal renders into document.body, outside the RTL container.
    expect(document.querySelector('[data-slot="drawer"]')).toBeTruthy();
  });

  it("exposes role=dialog with aria-modal and aria-labelledby wired to the title", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy as string);
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent).toBe("Agent detail");
  });

  it("calls onOpenChange(false) on Escape key", () => {
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // NOT COVERED — flagged, not faked green.
  //
  // Base UI's real focus-trap relies on the BROWSER's native Tab-key focus
  // traversal landing on `[data-base-ui-focus-guard]` sentinel elements,
  // which its own focusin handler then redirects back inside the popup.
  // jsdom implements neither: `fireEvent.keyDown(el, { key: "Tab" })` does
  // NOT move `document.activeElement` (verified: a version of this test
  // asserting `document.activeElement` after a Tab keydown passed
  // identically whether the drawer was mounted with `modal` `true` or
  // `false` — i.e. it was GREEN regardless of the guarantee being on or
  // off, so it was measuring nothing). The focus-guard sentinel *count*
  // is equally unusable as a proxy: it went from 2 -> 4 elements under
  // `modal={false}`, an increase, not the removal a broken trap should
  // produce.
  //
  // The trap is exercised for real via `@base-ui/react`'s own test suite
  // (a locked, audited dependency — see package.json) and via manual /
  // Storybook keyboard QA, not by a jsdom unit assertion here.
  it.skip("traps focus inside the drawer (jsdom cannot simulate native Tab traversal — see comment above; verified via @base-ui/react's own suite + manual QA)", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const outside = screen.getByTestId("outside-trigger");
    const last = screen.getByTestId("last-field");
    last.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(document.activeElement).not.toBe(outside);
  });

  it("marks background content aria-hidden (inert) while the drawer is open", () => {
    // jsdom does not enforce the native `inert` attribute's focus-blocking
    // behavior (verified independently — a plain `el.inert = true` does not
    // stop `el.focus()` under jsdom either), so this asserts the actual
    // mechanism Base UI's Dialog applies to background content: an
    // aria-hidden wrapper around every sibling outside the dialog tree.
    render(<Harness open onOpenChange={() => {}} />);
    const outside = screen.getByTestId("outside-trigger");
    const hiddenAncestor = outside.closest('[aria-hidden="true"]');
    expect(hiddenAncestor).toBeTruthy();
  });

  it("removes the aria-hidden background wrapper once the drawer closes", () => {
    const { rerender } = render(<Harness open onOpenChange={() => {}} />);
    let outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeTruthy();
    rerender(<Harness open={false} onOpenChange={() => {}} />);
    outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("returns focus to the trigger on close", () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button type="button" data-testid="real-trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <MosaicDrawer
            open={open}
            onOpenChange={setOpen}
            title="Agent detail"
            closeAriaLabel="Close drawer"
          >
            <button type="button" data-testid="close-inside" onClick={() => setOpen(false)}>
              Close
            </button>
          </MosaicDrawer>
        </div>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByTestId("real-trigger");
    trigger.focus();
    fireEvent.click(trigger);
    const closeBtn = screen.getByTestId("close-inside");
    fireEvent.click(closeBtn);
    expect(document.activeElement).toBe(trigger);
  });

  it("is fully host-controlled: does not render when open=false even after mount", () => {
    const { rerender } = render(<Harness open onOpenChange={() => {}} />);
    expect(screen.queryByText("Agent detail")).toBeTruthy();
    rerender(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Agent detail")).toBeNull();
  });
});
