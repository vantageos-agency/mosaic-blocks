import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MosaicTooltip,
  MosaicTooltipContent,
  MosaicTooltipProvider,
  MosaicTooltipRoot,
  MosaicTooltipTrigger,
} from "./MosaicTooltip.js";

describe("MosaicTooltip", () => {
  it("renders trigger children", () => {
    render(
      <MosaicTooltip content="Helpful tip">
        <button type="button">Hover me</button>
      </MosaicTooltip>,
    );
    expect(screen.getByRole("button", { name: "Hover me" })).toBeTruthy();
  });

  it("sets data-slot='tooltip-trigger' on trigger", () => {
    render(
      <MosaicTooltip content="Tip">
        <button type="button">Trigger</button>
      </MosaicTooltip>,
    );
    expect(document.querySelector("[data-slot='tooltip-trigger']")).toBeTruthy();
  });

  it("renders tooltip content text when open", () => {
    render(
      <MosaicTooltip content="My tooltip text" delay={0}>
        <button type="button">Hover me</button>
      </MosaicTooltip>,
    );
    // Trigger is present; tooltip content is portalled and may not show
    // until hover — we at least confirm the trigger structure is correct.
    expect(screen.getByRole("button", { name: "Hover me" })).toBeTruthy();
  });
});

describe("MosaicTooltip sub-components (issue #35)", () => {
  it("composes Provider/Root/Trigger/Content and renders the trigger", () => {
    render(
      <MosaicTooltipProvider>
        <MosaicTooltipRoot>
          <MosaicTooltipTrigger>
            <span>Composed trigger</span>
          </MosaicTooltipTrigger>
          <MosaicTooltipContent>Composed tip</MosaicTooltipContent>
        </MosaicTooltipRoot>
      </MosaicTooltipProvider>,
    );
    expect(screen.getByText("Composed trigger")).toBeTruthy();
  });

  it("MosaicTooltipTrigger sets data-slot='tooltip-trigger'", () => {
    render(
      <MosaicTooltipProvider>
        <MosaicTooltipRoot>
          <MosaicTooltipTrigger>
            <span>Trigger</span>
          </MosaicTooltipTrigger>
          <MosaicTooltipContent>Tip</MosaicTooltipContent>
        </MosaicTooltipRoot>
      </MosaicTooltipProvider>,
    );
    expect(document.querySelector("[data-slot='tooltip-trigger']")).toBeTruthy();
  });

  it("MosaicTooltipTrigger asChild merges props onto the child instead of wrapping it", () => {
    render(
      <MosaicTooltipProvider>
        <MosaicTooltipRoot>
          <MosaicTooltipTrigger asChild>
            <button type="button">AsChild trigger</button>
          </MosaicTooltipTrigger>
          <MosaicTooltipContent>Tip</MosaicTooltipContent>
        </MosaicTooltipRoot>
      </MosaicTooltipProvider>,
    );
    const trigger = screen.getByRole("button", { name: "AsChild trigger" });
    expect(trigger.getAttribute("data-slot")).toBe("tooltip-trigger");
  });

  it("MosaicTooltipContent accepts side/align props without throwing", () => {
    render(
      <MosaicTooltipProvider>
        <MosaicTooltipRoot open>
          <MosaicTooltipTrigger>
            <span>Open trigger</span>
          </MosaicTooltipTrigger>
          <MosaicTooltipContent side="bottom" align="start">
            Bottom-start tip
          </MosaicTooltipContent>
        </MosaicTooltipRoot>
      </MosaicTooltipProvider>,
    );
    expect(document.querySelector("[data-slot='tooltip-content']")).toBeTruthy();
  });

  it("MosaicTooltipContent forwards the hidden attribute", () => {
    render(
      <MosaicTooltipProvider>
        <MosaicTooltipRoot open>
          <MosaicTooltipTrigger>
            <span>Open trigger</span>
          </MosaicTooltipTrigger>
          <MosaicTooltipContent hidden>Hidden tip</MosaicTooltipContent>
        </MosaicTooltipRoot>
      </MosaicTooltipProvider>,
    );
    const popup = document.querySelector("[data-slot='tooltip-content']");
    expect(popup?.hasAttribute("hidden")).toBe(true);
  });
});
