/**
 * MosaicSkeleton — unit tests (vitest + @testing-library/react)
 *
 * Follows the Button.test.tsx pattern.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicSkeleton } from "./MosaicSkeleton.js";

describe("MosaicSkeleton", () => {
  it("renders with data-slot='skeleton'", () => {
    render(<MosaicSkeleton />);
    const el = document.querySelector("[data-slot='skeleton']");
    expect(el).not.toBeNull();
    expect(el?.getAttribute("data-slot")).toBe("skeleton");
  });

  it("applies animate-pulse and bg-muted base classes", () => {
    render(<MosaicSkeleton />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("bg-muted");
  });

  it("applies default variant (rounded-md)", () => {
    render(<MosaicSkeleton />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("rounded-md");
  });

  it("applies text variant classes (h-4 rounded)", () => {
    render(<MosaicSkeleton variant="text" />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("rounded");
  });

  it("applies circle variant classes (rounded-full aspect-square)", () => {
    render(<MosaicSkeleton variant="circle" />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("rounded-full");
    expect(el.className).toContain("aspect-square");
  });

  it("applies button variant classes (h-9 rounded-md)", () => {
    render(<MosaicSkeleton variant="button" />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("h-9");
    expect(el.className).toContain("rounded-md");
  });

  it("merges custom className", () => {
    render(<MosaicSkeleton className="w-32 h-8" />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.className).toContain("w-32");
    expect(el.className).toContain("h-8");
  });

  it("renders single line when lines=1 (default)", () => {
    render(<MosaicSkeleton variant="text" lines={1} />);
    // Single line: renders a plain div with data-slot
    const slots = document.querySelectorAll("[data-slot='skeleton']");
    expect(slots.length).toBe(1);
  });

  it("renders N child lines when variant=text and lines>1", () => {
    render(<MosaicSkeleton variant="text" lines={3} />);
    // Wrapper div has data-slot="skeleton"; children are 3 line divs
    const wrapper = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(wrapper).not.toBeNull();
    // 3 child divs inside the wrapper
    const children = wrapper.querySelectorAll("div");
    expect(children.length).toBe(3);
  });

  it("applies ~60% width on last line when lines>1", () => {
    render(<MosaicSkeleton variant="text" lines={3} />);
    const wrapper = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    const children = Array.from(wrapper.querySelectorAll("div")) as HTMLElement[];
    const lastChild = children[children.length - 1];
    expect(lastChild.className).toContain("w-[60%]");
  });

  it("passes arbitrary HTML attributes to the root element", () => {
    render(<MosaicSkeleton aria-label="Loading content" />);
    const el = document.querySelector("[data-slot='skeleton']") as HTMLElement;
    expect(el.getAttribute("aria-label")).toBe("Loading content");
  });

  it("forwards ref to the root div element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<MosaicSkeleton ref={ref as React.RefObject<HTMLDivElement>} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("div");
  });
});
