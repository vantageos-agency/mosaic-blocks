/**
 * MosaicSwitch — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicSwitch.tsx exists)
 *
 * Note: @base-ui/react Switch.Root dispatches `new ownerWindow(el).PointerEvent`
 * on pointer interactions. jsdom 24+ exposes PointerEvent globally but base-ui
 * reads it from ownerWindow — polyfill ensures click-path works in tests.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Polyfill PointerEvent on window for @base-ui/react Switch in jsdom
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {}
  // @ts-expect-error -- jsdom polyfill: window.PointerEvent not present in all jsdom builds
  window.PointerEvent = PointerEventPolyfill;
}

import { MosaicSwitch } from "./MosaicSwitch.js";

describe("MosaicSwitch", () => {
  it("renders with role=switch", () => {
    render(<MosaicSwitch aria-label="Dark mode" />);
    expect(screen.getByRole("switch")).toBeTruthy();
  });

  it("sets data-slot='switch' on the root element", () => {
    render(<MosaicSwitch aria-label="Notifications" />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("data-slot")).toBe("switch");
  });

  it("starts unchecked by default (uncontrolled)", () => {
    render(<MosaicSwitch aria-label="Toggle" />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  it("toggles on Space key (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<MosaicSwitch aria-label="Toggle" />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await user.keyboard(" ");
    expect(sw.getAttribute("aria-checked")).toBe("true");
    sw.focus();
    await user.keyboard(" ");
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  it("toggles on Enter key (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<MosaicSwitch aria-label="Toggle" />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await user.keyboard("{Enter}");
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });

  it("calls onCheckedChange with new value on Space", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicSwitch aria-label="Toggle" onCheckedChange={handler} />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await user.keyboard(" ");
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe(true);
  });

  it("respects controlled checked prop", () => {
    render(<MosaicSwitch aria-label="On" checked />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });

  it("is disabled when disabled prop is set", () => {
    render(<MosaicSwitch aria-label="Toggle" disabled />);
    const sw = screen.getByRole("switch");
    expect(
      sw.getAttribute("disabled") !== null ||
        sw.getAttribute("aria-disabled") === "true" ||
        (sw as HTMLButtonElement).disabled,
    ).toBeTruthy();
  });

  it("renders a thumb element inside", () => {
    const { container } = render(<MosaicSwitch aria-label="Toggle" />);
    const thumb = container.querySelector("[data-slot='switch-thumb']");
    expect(thumb).toBeTruthy();
  });

  it("accepts defaultChecked for uncontrolled initial state", () => {
    render(<MosaicSwitch aria-label="Toggle" defaultChecked />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicSwitch aria-label="Toggle" disabled onCheckedChange={handler} />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await user.keyboard(" ");
    expect(handler).not.toHaveBeenCalled();
  });
});
