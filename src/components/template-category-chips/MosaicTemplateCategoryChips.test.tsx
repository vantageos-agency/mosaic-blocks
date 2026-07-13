/**
 * MosaicTemplateCategoryChips — RED-first TDD
 *
 * Ported from any-debate-ai `components/templates/shared/TemplateCategoryChips.tsx`
 * (source read verbatim via `gh api repos/elpiarthera/any-debate-ai/contents/
 * components/templates/shared/TemplateCategoryChips.tsx`). That component
 * hardcodes the sentinel `"All"` string and a closed `TemplateCategory` union
 * imported from `@/lib/templates/types` — both business taxonomy baked into
 * the component. Here `categories` (including any "all" pseudo-category) is
 * 100% host-supplied data; the library has never heard of a single category
 * name.
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicTemplateCategoryChips.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  type MosaicTemplateCategory,
  MosaicTemplateCategoryChips,
} from "./MosaicTemplateCategoryChips.js";

const categories: MosaicTemplateCategory[] = [
  { id: "all", label: "All" },
  { id: "business", label: "Business" },
  { id: "creative", label: "Creative" },
  { id: "research", label: "Research" },
];

function baseProps() {
  return {
    categories,
    selected: "all",
    onSelect: vi.fn(),
  };
}

describe("MosaicTemplateCategoryChips", () => {
  it("renders one chip per host-supplied category", () => {
    render(<MosaicTemplateCategoryChips {...baseProps()} />);
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Business")).toBeTruthy();
    expect(screen.getByText("Creative")).toBeTruthy();
    expect(screen.getByText("Research")).toBeTruthy();
  });

  it("sets data-slot='template-category-chips' on the root element", () => {
    const { container } = render(<MosaicTemplateCategoryChips {...baseProps()} />);
    expect(container.querySelector("[data-slot='template-category-chips']")).toBeTruthy();
  });

  it("renders each category as a real <button>", () => {
    render(<MosaicTemplateCategoryChips {...baseProps()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.tagName).toBe("BUTTON");
    }
  });

  it("announces the selected category via aria-pressed, not color alone", () => {
    render(<MosaicTemplateCategoryChips {...baseProps()} />);
    const allButton = screen.getByRole("button", { name: "All" });
    const businessButton = screen.getByRole("button", { name: "Business" });
    expect(allButton.getAttribute("aria-pressed")).toBe("true");
    expect(businessButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onSelect(id) when a chip is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateCategoryChips {...props} />);
    await user.click(screen.getByRole("button", { name: "Creative" }));
    expect(props.onSelect).toHaveBeenCalledWith("creative");
  });

  it("is keyboard-activatable (Enter key triggers onSelect)", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateCategoryChips {...props} />);
    const researchButton = screen.getByRole("button", { name: "Research" });
    researchButton.focus();
    await user.keyboard("{Enter}");
    expect(props.onSelect).toHaveBeenCalledWith("research");
  });

  it("does not crash on an empty categories list", () => {
    const { container } = render(
      <MosaicTemplateCategoryChips categories={[]} selected="all" onSelect={vi.fn()} />,
    );
    expect(container.querySelector("[data-slot='template-category-chips']")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("accepts a className on the root element", () => {
    const { container } = render(
      <MosaicTemplateCategoryChips {...baseProps()} className="custom-class" />,
    );
    expect(container.querySelector("[data-slot='template-category-chips']")?.className).toContain(
      "custom-class",
    );
  });
});
