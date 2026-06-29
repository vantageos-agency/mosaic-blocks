import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MosaicCheckbox } from "./MosaicCheckbox.js";

describe("MosaicCheckbox", () => {
  it("renders with role=checkbox", () => {
    render(<MosaicCheckbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  it("sets data-slot='checkbox' attribute", () => {
    render(<MosaicCheckbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox").getAttribute("data-slot")).toBe("checkbox");
  });

  it("calls onCheckedChange when clicked", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MosaicCheckbox aria-label="Accept" onCheckedChange={handler} />);
    await user.click(screen.getByRole("checkbox"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is set", () => {
    render(<MosaicCheckbox aria-label="Accept" disabled />);
    const el = screen.getByRole("checkbox");
    expect(
      el.getAttribute("aria-disabled") === "true" ||
        el.getAttribute("data-disabled") !== null ||
        (el as HTMLButtonElement).disabled,
    ).toBeTruthy();
  });
});
