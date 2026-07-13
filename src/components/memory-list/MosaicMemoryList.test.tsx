/**
 * MosaicMemoryList — tests
 *
 * Coverage: root gets `data-slot="memory-list"` and renders a native `<ul>`
 * (implicit `role="list"`) when items are present; items are rendered
 * through the host-supplied `renderItem` (the list never renders a row of
 * its own — no card markup baked in); an empty `items` array renders ONLY
 * the host-supplied `emptyMessage`, never an invented fallback and never a
 * silent blank; the `density` cva variant ("comfortable" default vs.
 * "compact") changes ONLY the container's Tailwind classes; rows are
 * divided by the `divide-y` treatment; roving-tabindex keyboard navigation;
 * custom `className` / `itemClassName` are applied.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicMemoryList } from "./MosaicMemoryList.js";

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

describe("MosaicMemoryList", () => {
  it("renders a native <ul> (implicit role='list') on the root when items are present", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-list']");
    expect(root).toBeTruthy();
    expect(root?.tagName).toBe("UL");
    expect(screen.getByRole("list")).toBeTruthy();
  });

  it("renders every item through the host-supplied renderItem, not a built-in row", () => {
    render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Bravo")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
  });

  it("wraps each rendered item in a native <li> (implicit role='listitem')", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-list-item']");
    expect(wrappers.length).toBe(3);
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.tagName).toBe("LI");
    }
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("renders EXACTLY the host-supplied content per row — no hardcoded text of its own", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    expect(wrappers[0].textContent).toBe("Alpha");
    expect(wrappers[1].textContent).toBe("Bravo");
    expect(wrappers[2].textContent).toBe("Charlie");
  });

  it("renders ONLY the host-supplied emptyMessage when items is empty — no invented fallback", () => {
    const { container } = render(
      <MosaicMemoryList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='memory-list-item']").length).toBe(0);
  });

  it("renders a plain <div> (not a <ul>) when the empty state is shown", () => {
    const { container } = render(
      <MosaicMemoryList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-list']");
    expect(root?.tagName).toBe("DIV");
  });

  it("is a single-column stacked layout with a row divider by default", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='memory-list']");
    expect(root?.className).toContain("flex-col");
    expect(root?.className).toContain("divide-y");
  });

  it("defaults to the 'comfortable' density — wider row padding", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-list-item']");
    expect(wrappers[0].className).toContain("py-3");
  });

  it("switches to 'compact' density — tighter row padding", () => {
    const { container } = render(
      <MosaicMemoryList
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        density="compact"
      />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-list-item']");
    expect(wrappers[0].className).toContain("py-1");
    expect(wrappers[0].className).not.toContain("py-3");
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicMemoryList
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='memory-list']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("applies custom itemClassName to each item wrapper", () => {
    const { container } = render(
      <MosaicMemoryList
        items={ENTRIES}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        itemClassName="my-item-class"
      />,
    );
    const wrappers = container.querySelectorAll("[data-slot='memory-list-item']");
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.className).toContain("my-item-class");
    }
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  it("gives exactly one item tabIndex=0 (the first) and the rest tabIndex=-1 initially", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
    expect(wrappers[2].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves focus (and tabIndex=0) to the next item", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowDown" });

    expect(document.activeElement).toBe(wrappers[1]);
    expect(wrappers[1].getAttribute("tabindex")).toBe("0");
    expect(wrappers[0].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowUp moves focus to the previous item", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowDown" });
    fireEvent.keyDown(wrappers[1], { key: "ArrowUp" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("clamps at the last item — ArrowDown on the last item does nothing further", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(wrappers[2]);
    expect(wrappers[2].getAttribute("tabindex")).toBe("0");
  });

  it("Home jumps focus to the first item, End jumps to the last", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "Home" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("does not move focus on a non-navigation key", () => {
    const { container } = render(
      <MosaicMemoryList items={ENTRIES} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='memory-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "a" });
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
  });
});
