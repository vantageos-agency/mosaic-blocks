/**
 * MosaicTemplateList — tests
 *
 * Coverage: root gets `data-slot="template-list"` + `role="list"` when items
 * are present; items are rendered through the host-supplied `renderItem`
 * (the list never renders a vignette of its own — no card markup baked in);
 * an empty `items` array renders ONLY the host-supplied `emptyMessage`, never
 * an invented fallback and never a silent blank; the `layout` cva variant
 * ("grid" default vs. "list") changes ONLY the container's Tailwind classes;
 * roving-tabindex keyboard navigation (exactly one item `tabIndex=0` at a
 * time, arrow keys move focus, Home/End jump to the ends, navigation clamps
 * at both boundaries); custom `className` / `itemClassName` are applied.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicTemplateList } from "./MosaicTemplateList.js";

const EMPTY_MESSAGE = "Aucun agent-type disponible";

interface Item {
  id: string;
  label: string;
}

const ITEMS: Item[] = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Bravo" },
  { id: "c", label: "Charlie" },
];

function renderItem(item: Item) {
  return <span>{item.label}</span>;
}

describe("MosaicTemplateList", () => {
  it("renders a native <ul> (implicit role='list') on the root when items are present", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='template-list']");
    expect(root).toBeTruthy();
    expect(root?.tagName).toBe("UL");
    expect(screen.getByRole("list")).toBeTruthy();
  });

  it("renders every item through the host-supplied renderItem, not a built-in card", () => {
    render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Bravo")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
  });

  it("wraps each rendered item in a native <li> (implicit role='listitem')", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = container.querySelectorAll("[data-slot='template-list-item']");
    expect(wrappers.length).toBe(3);
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.tagName).toBe("LI");
    }
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("renders ONLY the host-supplied emptyMessage when items is empty — no invented fallback", () => {
    const { container } = render(
      <MosaicTemplateList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='template-list-item']").length).toBe(0);
  });

  it("renders a plain <div> (not a <ul>) when the empty state is shown", () => {
    const { container } = render(
      <MosaicTemplateList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='template-list']");
    expect(root?.tagName).toBe("DIV");
  });

  it("defaults to the 'grid' layout — responsive column classes", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='template-list']");
    expect(root?.className).toContain("grid-cols-1");
    expect(root?.className).toContain("sm:grid-cols-2");
    expect(root?.className).toContain("lg:grid-cols-3");
  });

  it("switches to a single-column list when layout='list'", () => {
    const { container } = render(
      <MosaicTemplateList
        items={ITEMS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="list"
      />,
    );
    const root = container.querySelector("[data-slot='template-list']");
    expect(root?.className).toContain("grid-cols-1");
    expect(root?.className).not.toContain("sm:grid-cols-2");
    expect(root?.className).not.toContain("lg:grid-cols-3");
  });

  it("changing layout never changes the props contract — same items render the same content", () => {
    const { rerender, container } = render(
      <MosaicTemplateList
        items={ITEMS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="grid"
      />,
    );
    const gridCount = container.querySelectorAll("[data-slot='template-list-item']").length;
    rerender(
      <MosaicTemplateList
        items={ITEMS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="list"
      />,
    );
    const listCount = container.querySelectorAll("[data-slot='template-list-item']").length;
    expect(gridCount).toBe(3);
    expect(listCount).toBe(3);
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicTemplateList
        items={ITEMS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='template-list']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("applies custom itemClassName to each item wrapper", () => {
    const { container } = render(
      <MosaicTemplateList
        items={ITEMS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        itemClassName="my-item-class"
      />,
    );
    const wrappers = container.querySelectorAll("[data-slot='template-list-item']");
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.className).toContain("my-item-class");
    }
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  it("gives exactly one item tabIndex=0 (the first) and the rest tabIndex=-1 initially", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
    expect(wrappers[2].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves focus (and tabIndex=0) to the next item", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowDown" });

    expect(document.activeElement).toBe(wrappers[1]);
    expect(wrappers[1].getAttribute("tabindex")).toBe("0");
    expect(wrappers[0].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowRight also moves focus to the next item (grid navigation)", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowRight" });

    expect(document.activeElement).toBe(wrappers[1]);
  });

  it("ArrowUp / ArrowLeft move focus to the previous item", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowDown" });
    fireEvent.keyDown(wrappers[1], { key: "ArrowDown" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "ArrowUp" });
    expect(document.activeElement).toBe(wrappers[1]);
  });

  it("clamps at the last item — ArrowDown/ArrowRight on the last item does nothing further", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(wrappers[2]);
    expect(wrappers[2].getAttribute("tabindex")).toBe("0");
  });

  it("clamps at the first item — ArrowUp/ArrowLeft on the first item does nothing further", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(wrappers[0]);
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
  });

  it("Home jumps focus to the first item", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);

    fireEvent.keyDown(wrappers[2], { key: "Home" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("End jumps focus to the last item", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);
  });

  it("does not move focus on a non-navigation key", () => {
    const { container } = render(
      <MosaicTemplateList items={ITEMS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='template-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "a" });
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
  });
});
