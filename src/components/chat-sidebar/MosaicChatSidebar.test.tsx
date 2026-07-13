/**
 * MosaicChatSidebar — tests
 *
 * Coverage: threads render ONLY through the host-supplied `renderThread`
 * (never a vignette of its own — no thread title/preview markup baked in);
 * the active thread (host-controlled `activeThreadId`) gets the highlighted
 * `data-active="true"` state, all others `data-active="false"`; clicking a
 * row calls `onSelectThread` with that thread's id; the "new thread" action
 * renders the host-supplied label and calls `onNewThread` on click; an empty
 * `threads` array renders ONLY the host-supplied `emptyMessage`, never an
 * invented fallback; roving-tabindex keyboard navigation (ArrowDown/ArrowUp,
 * Home/End, Enter/Space selects).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicChatSidebar } from "./MosaicChatSidebar.js";

const NEW_THREAD_LABEL = "Nouvelle conversation";
const EMPTY_MESSAGE = "Aucune conversation";

interface Thread {
  id: string;
  title: string;
}

const THREADS: Thread[] = [
  { id: "t1", title: "Onboarding plan" },
  { id: "t2", title: "Release checklist" },
  { id: "t3", title: "Bug triage" },
];

function renderThread(thread: Thread) {
  return <span>{thread.title}</span>;
}

describe("MosaicChatSidebar", () => {
  it("renders every thread through the host-supplied renderThread, not a built-in row", () => {
    render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    expect(screen.getByText("Onboarding plan")).toBeTruthy();
    expect(screen.getByText("Release checklist")).toBeTruthy();
    expect(screen.getByText("Bug triage")).toBeTruthy();
  });

  it("renders ONLY host-supplied threads — no thread the host never passed in", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = container.querySelectorAll("[data-slot='chat-sidebar-thread']");
    expect(rows.length).toBe(THREADS.length);
  });

  it("marks the host-controlled activeThreadId row data-active=true, all others false", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId="t2"
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    expect(rows[0].getAttribute("data-active")).toBe("false");
    expect(rows[1].getAttribute("data-active")).toBe("true");
    expect(rows[2].getAttribute("data-active")).toBe("false");
  });

  it("no row is active when activeThreadId is null", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    for (const row of rows) {
      expect(row.getAttribute("data-active")).toBe("false");
    }
  });

  it("calls onSelectThread with the clicked thread's id", () => {
    const onSelectThread = vi.fn();
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={onSelectThread}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.click(rows[2]);
    expect(onSelectThread).toHaveBeenCalledWith("t3");
  });

  it("renders the host-supplied newThreadLabel on the new-thread action", () => {
    render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    expect(screen.getByText(NEW_THREAD_LABEL)).toBeTruthy();
  });

  it("calls onNewThread when the new-thread action is clicked", () => {
    const onNewThread = vi.fn();
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={onNewThread}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const button = container.querySelector("[data-slot='chat-sidebar-new-thread']");
    expect(button).toBeTruthy();
    fireEvent.click(button as Element);
    expect(onNewThread).toHaveBeenCalledTimes(1);
  });

  it("renders ONLY the host-supplied emptyMessage when threads is empty — no invented fallback", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={[]}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='chat-sidebar-thread']").length).toBe(0);
  });

  it("still renders the new-thread action when threads is empty", () => {
    render(
      <MosaicChatSidebar
        threads={[]}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    expect(screen.getByText(NEW_THREAD_LABEL)).toBeTruthy();
  });

  it("applies custom itemClassName to each thread row", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
        itemClassName="my-item-class"
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    for (const row of rows) {
      expect(row.className).toContain("my-item-class");
    }
  });

  // ── Keyboard navigation ──────────────────────────────────────────────────

  it("gives exactly one row tabIndex=0 (the first) and the rest tabIndex=-1 initially", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    expect(rows[0].getAttribute("tabindex")).toBe("0");
    expect(rows[1].getAttribute("tabindex")).toBe("-1");
    expect(rows[2].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves focus (and tabIndex=0) to the next row", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.keyDown(rows[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1].getAttribute("tabindex")).toBe("0");
    expect(rows[0].getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowUp moves focus to the previous row", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.keyDown(rows[0], { key: "ArrowDown" });
    fireEvent.keyDown(rows[1], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("Home jumps focus to the first row, End to the last", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.keyDown(rows[0], { key: "End" });
    expect(document.activeElement).toBe(rows[2]);
    fireEvent.keyDown(rows[2], { key: "Home" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("clamps at the last row — ArrowDown on the last row does nothing further", () => {
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.keyDown(rows[0], { key: "End" });
    fireEvent.keyDown(rows[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[2]);
    expect(rows[2].getAttribute("tabindex")).toBe("0");
  });

  it("Enter on a focused row calls onSelectThread with that row's id", () => {
    const onSelectThread = vi.fn();
    const { container } = render(
      <MosaicChatSidebar
        threads={THREADS}
        renderThread={renderThread}
        activeThreadId={null}
        onSelectThread={onSelectThread}
        onNewThread={vi.fn()}
        newThreadLabel={NEW_THREAD_LABEL}
        emptyMessage={EMPTY_MESSAGE}
      />,
    );
    const rows = Array.from(container.querySelectorAll("[data-slot='chat-sidebar-thread']"));
    fireEvent.keyDown(rows[1], { key: "Enter" });
    expect(onSelectThread).toHaveBeenCalledWith("t2");
  });
});
