/**
 * MosaicSessionList — RED-first TDD
 *
 * Coverage: root gets `data-slot="session-list"` and renders a native `<ul>`
 * when items are present; items render through the host-supplied
 * `renderItem` only (no built-in row markup, no hardcoded content); the four
 * merged source dispositions ("stack" default / "grid" / "compact" /
 * "inline") each render as ONE variant-driven component, never four
 * components; empty `items` renders ONLY the host-supplied `emptyMessage`
 * (SIN-01, no invented fallback); roving-tabindex keyboard navigation;
 * zero network I/O; className/itemClassName forwarding.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicSessionList } from "./MosaicSessionList.js";

const EMPTY_MESSAGE = "No sessions in progress";

interface Session {
  id: string;
  title: string;
}

const SESSIONS: Session[] = [
  { id: "a", title: "Mandate A" },
  { id: "b", title: "Mandate B" },
  { id: "c", title: "Mandate C" },
];

function renderItem(session: Session) {
  return <span>{session.title}</span>;
}

describe("MosaicSessionList", () => {
  it("renders a native <ul> (implicit role='list') when items are present", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root).toBeTruthy();
    expect(root?.tagName).toBe("UL");
    expect(screen.getByRole("list")).toBeTruthy();
  });

  it("renders every item through the host-supplied renderItem, not a built-in row", () => {
    render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText("Mandate A")).toBeTruthy();
    expect(screen.getByText("Mandate B")).toBeTruthy();
    expect(screen.getByText("Mandate C")).toBeTruthy();
  });

  it("wraps each item in a native <li> (implicit role='listitem')", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = container.querySelectorAll("[data-slot='session-list-item']");
    expect(wrappers.length).toBe(3);
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("defaults to the 'stack' layout", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.getAttribute("data-layout")).toBe("stack");
    expect(root?.className).toContain("flex-col");
  });

  it("'grid' layout renders a tile grid container — same items+renderItem contract", () => {
    const { container } = render(
      <MosaicSessionList
        items={SESSIONS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="grid"
      />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.getAttribute("data-layout")).toBe("grid");
    expect(root?.className).toContain("grid");
    expect(screen.getByText("Mandate A")).toBeTruthy();
  });

  it("'compact' layout renders a dense single-column container", () => {
    const { container } = render(
      <MosaicSessionList
        items={SESSIONS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="compact"
      />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.getAttribute("data-layout")).toBe("compact");
    expect(screen.getByText("Mandate B")).toBeTruthy();
  });

  it("'inline' layout renders a horizontal-scroll row container", () => {
    const { container } = render(
      <MosaicSessionList
        items={SESSIONS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        layout="inline"
      />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.getAttribute("data-layout")).toBe("inline");
    expect(root?.className).toContain("flex-row");
    expect(screen.getByText("Mandate C")).toBeTruthy();
  });

  it("renders ONLY the host-supplied emptyMessage when items is empty — no invented fallback", () => {
    const { container } = render(
      <MosaicSessionList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='session-list-item']").length).toBe(0);
  });

  it("renders a plain <div> (not a <ul>) when the empty state is shown", () => {
    const { container } = render(
      <MosaicSessionList items={[]} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.tagName).toBe("DIV");
  });

  it("gives exactly one item tabIndex=0 (the first) and the rest tabIndex=-1 initially", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='session-list-item']"));
    expect(wrappers[0].getAttribute("tabindex")).toBe("0");
    expect(wrappers[1].getAttribute("tabindex")).toBe("-1");
    expect(wrappers[2].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves focus (and tabIndex=0) to the next item", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='session-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(wrappers[1]);
    expect(wrappers[1].getAttribute("tabindex")).toBe("0");
    expect(wrappers[0].getAttribute("tabindex")).toBe("-1");
  });

  it("Home / End jump focus to the first / last item", () => {
    const { container } = render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    const wrappers = Array.from(container.querySelectorAll("[data-slot='session-list-item']"));
    fireEvent.keyDown(wrappers[0], { key: "End" });
    expect(document.activeElement).toBe(wrappers[2]);
    fireEvent.keyDown(wrappers[2], { key: "Home" });
    expect(document.activeElement).toBe(wrappers[0]);
  });

  it("applies custom className to the root and itemClassName to each item wrapper", () => {
    const { container } = render(
      <MosaicSessionList
        items={SESSIONS}
        renderItem={renderItem}
        emptyMessage={EMPTY_MESSAGE}
        className="my-session-list"
        itemClassName="my-session-item"
      />,
    );
    const root = container.querySelector("[data-slot='session-list']");
    expect(root?.className).toContain("my-session-list");
    const wrappers = container.querySelectorAll("[data-slot='session-list-item']");
    for (const wrapper of Array.from(wrappers)) {
      expect(wrapper.className).toContain("my-session-item");
    }
  });

  it("does not perform any network I/O — the list never fetches its own data", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockImplementation(() => {
      throw new Error("MosaicSessionList must not call fetch");
    });
    render(
      <MosaicSessionList items={SESSIONS} renderItem={renderItem} emptyMessage={EMPTY_MESSAGE} />,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
