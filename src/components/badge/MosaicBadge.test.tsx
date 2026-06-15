/**
 * MosaicBadge — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicBadge.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicBadge } from "./MosaicBadge.js";

describe("MosaicBadge", () => {
  it("renders a span with data-slot='badge'", () => {
    render(<MosaicBadge>New</MosaicBadge>);
    const el = screen.getByText("New");
    expect(el.tagName.toLowerCase()).toBe("span");
    expect(el.getAttribute("data-slot")).toBe("badge");
  });

  it("renders children", () => {
    render(<MosaicBadge>Beta</MosaicBadge>);
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("applies default variant class (bg-primary)", () => {
    render(<MosaicBadge>Default</MosaicBadge>);
    expect(screen.getByText("Default").className).toContain("bg-primary");
  });

  it("applies secondary variant class", () => {
    render(<MosaicBadge variant="secondary">Secondary</MosaicBadge>);
    expect(screen.getByText("Secondary").className).toContain("bg-secondary");
  });

  it("applies destructive variant class", () => {
    render(<MosaicBadge variant="destructive">Error</MosaicBadge>);
    expect(screen.getByText("Error").className).toContain("bg-destructive");
  });

  it("applies outline variant class", () => {
    render(<MosaicBadge variant="outline">Outline</MosaicBadge>);
    expect(screen.getByText("Outline").className).toContain("border-border");
  });

  it("accepts additional className", () => {
    render(<MosaicBadge className="my-custom">Label</MosaicBadge>);
    expect(screen.getByText("Label").className).toContain("my-custom");
  });
});
