import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  MosaicCollapsible,
  MosaicCollapsiblePanel,
  MosaicCollapsibleTrigger,
} from "./MosaicCollapsible.js";

describe("MosaicCollapsible", () => {
  it("renders trigger as a button", () => {
    render(
      <MosaicCollapsible>
        <MosaicCollapsibleTrigger>Toggle</MosaicCollapsibleTrigger>
        <MosaicCollapsiblePanel>Content</MosaicCollapsiblePanel>
      </MosaicCollapsible>,
    );
    expect(screen.getByRole("button", { name: "Toggle" })).toBeTruthy();
  });

  it("sets correct data-slot attributes", () => {
    render(
      <MosaicCollapsible defaultOpen>
        <MosaicCollapsibleTrigger>Toggle</MosaicCollapsibleTrigger>
        <MosaicCollapsiblePanel>Content</MosaicCollapsiblePanel>
      </MosaicCollapsible>,
    );
    expect(document.querySelector("[data-slot='collapsible']")).toBeTruthy();
    expect(document.querySelector("[data-slot='collapsible-trigger']")).toBeTruthy();
    expect(document.querySelector("[data-slot='collapsible-panel']")).toBeTruthy();
  });

  it("expands panel on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <MosaicCollapsible>
        <MosaicCollapsibleTrigger>Toggle</MosaicCollapsibleTrigger>
        <MosaicCollapsiblePanel>Hidden content</MosaicCollapsiblePanel>
      </MosaicCollapsible>,
    );
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("Hidden content")).toBeTruthy();
  });
});
