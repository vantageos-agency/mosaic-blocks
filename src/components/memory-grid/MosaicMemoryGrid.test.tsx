/**
 * MosaicMemoryGrid — tests
 *
 * Coverage: root gets `data-slot="memory-grid"` and renders a native `<ul>`
 * (implicit `role="list"`) when items are present; items are rendered
 * through the host-supplied `renderItem` (the grid never renders a tile of
 * its own — no card markup baked in); an empty `items` array renders ONLY
 * the host-supplied `emptyMessage`, never an invented fallback and never a
 * silent blank; the `density` cva variant ("comfortable" default vs.
 * "compact") changes ONLY the container's Tailwind classes; roving-tabindex
 * keyboard navigation; custom `className` / `itemClassName` are applied.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicMemoryGrid } from "./MosaicMemoryGrid.js";

const EMPTY_MESSAGE = "Aucune entree dans la base de connaissances";

interface Entry {
  id: string;
  label: string;
}

const ENTRIES: Entry[] = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Bravo" },
  { id: "c", label: "Charlie" },
];

function renderItem(entry: Entry) {
  return <span>{entry.label}</span>;
}

describe("MosaicMemoryGrid", () => {
  it("renders a native <ul> (implicit role='list') on the root when items are present", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-grid']");
    expect(root).toBeTruthy();
    expect(root?.tagName).toBe("UL");
    expect(screen.getByRole("list")).toBeTruthy();
  });

  it("renders every item through the host-supplied renderItem, not a built-in tile", () => {
    render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Bravo")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
  });

  it("wraps each rendered item in a native <li> (implicit role='listitem')", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-grid-item']");
    expect(wrappers.length).toBe(3);
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.tagName).toBe("LI");
    }
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("renders EXACTLY the host-supplied content per tile — no hardcoded text of its own", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    expect(wrappers[0].textContent).toBe("Alpha");
    expect(wrappers[1].textContent).toBe("Bravo");
    expect(wrappers[2].textContent).toBe("Charlie");
  });

  it("renders ONLY the host-supplied emptyMessage when items is empty — no invented fallback", () => {
    const { container } = render(
      <MosaicMemoryGrid items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='memory-grid-item']").length).toBe(0);
  });

  it("renders a plain <div> (not a <ul>) when the empty state is shown", () => {
    const { container } = render(
      <MosaicMemoryGrid items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-grid']");
    expect(root?.tagName).toBe("DIV");
  });

  it("defaults to the 'comfortable' density — wider gap classes", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-grid']");
    expect(root?.className).toContain("gap-4");
    expect(root?.className).toContain("grid-cols-1");
    expect(root?.className).toContain("sm:grid-cols-2");
    expect(root?.className).toContain("lg:grid-cols-3");
  });

  it("switches to 'compact' density — tighter gap classes, same column layout", () => {
    const { container } = render(
      <MosaicMemoryGrid
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        density="compact"
      />,
    );
    const root = container.querySelector("[data-slot='memory-grid']");
    expect(root?.className).toContain("gap-2");
    expect(root?.className).not.toContain("gap-4");
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicMemoryGrid
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='memory-grid']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("applies custom itemClassName to each item wrapper", () => {
    const { container } = render(
      <MosaicMemoryGrid
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        itemClassName="my-item-class"
      />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-grid-item']");
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.className).toContain("my-item-class");
    }
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  it("gives exactly one item tabIndex=0 (the first) and the rest tabIndex=-1 initially", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
    expect(wrappers[2].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowRight moves focus (and tabIndex=0) to the next item", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowRight" });

    expect(document.activeElement).toBe(wrappers[1]);
    expect(wrappers[1].getAttribute("tabindex")).toBe("0");
    expect(wrappers[0].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowLeft moves focus to the previous item", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowRight" });
    fireEvent.keyDown(wrappers[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("clamps at the last item — ArrowRight on the last item does nothing further", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "ArrowRight" });
    expect(document.activeElement).toBe(wrappers[2]);
    expect(wrappers[2].getAttribute("tabindex")).toBe("0");
  });

  it("Home jumps focus to the first item, End jumps to the last", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "Home" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("does not move focus on a non-navigation key", () => {
    const { container } = render(
      <MosaicMemoryGrid items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-grid-item']"));
    fireEvent.keyDown(wrappers[0], { key: "a" });
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
  });
});
