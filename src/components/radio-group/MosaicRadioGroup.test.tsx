import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MosaicRadioGroup, MosaicRadioGroupItem } from "./MosaicRadioGroup.js";

describe("MosaicRadioGroup", () => {
  it("renders with role=radiogroup", () => {
    render(
      <MosaicRadioGroup aria-label="Plan">
        <MosaicRadioGroupItem value="free">Free</MosaicRadioGroupItem>
        <MosaicRadioGroupItem value="pro">Pro</MosaicRadioGroupItem>
      </MosaicRadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toBeTruthy();
  });

  it("renders radio items", () => {
    render(
      <MosaicRadioGroup aria-label="Plan">
        <MosaicRadioGroupItem value="free">Free</MosaicRadioGroupItem>
        <MosaicRadioGroupItem value="pro">Pro</MosaicRadioGroupItem>
      </MosaicRadioGroup>,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("sets data-slot='radio-group' on root", () => {
    render(
      <MosaicRadioGroup aria-label="Plan">
        <MosaicRadioGroupItem value="free">Free</MosaicRadioGroupItem>
      </MosaicRadioGroup>,
    );
    expect(document.querySelector("[data-slot='radio-group']")).toBeTruthy();
  });

  it("calls onValueChange when radio is selected", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <MosaicRadioGroup aria-label="Plan" onValueChange={handler}>
        <MosaicRadioGroupItem value="free">Free</MosaicRadioGroupItem>
        <MosaicRadioGroupItem value="pro">Pro</MosaicRadioGroupItem>
      </MosaicRadioGroup>,
    );
    await user.click(screen.getByText("Free"));
    expect(handler).toHaveBeenCalled();
  });
});
