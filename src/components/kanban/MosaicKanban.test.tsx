/**
 * MosaicKanbanBoard + MosaicKanbanColumn — vitest tests
 *
 * Follows Button.test.tsx conventions:
 * - @testing-library/react render + screen
 * - vitest describe/it/expect
 * - No "same key" warnings in stderr (no array index keys)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicKanbanBoard } from "./MosaicKanbanBoard.js";
import { MosaicKanbanColumn } from "./MosaicKanbanColumn.js";

// ── MosaicKanbanBoard ─────────────────────────────────────────────────────────

describe("MosaicKanbanBoard", () => {
  it("renders its children", () => {
    render(
      <MosaicKanbanBoard>
        <div data-testid="child-column">Column</div>
      </MosaicKanbanBoard>,
    );
    expect(screen.getByTestId("child-column")).toBeTruthy();
  });

  it("sets data-slot='kanban-board'", () => {
    render(<MosaicKanbanBoard data-testid="board">children</MosaicKanbanBoard>);
    const board = screen.getByTestId("board");
    expect(board.getAttribute("data-slot")).toBe("kanban-board");
  });

  it("renders multiple columns side by side", () => {
    render(
      <MosaicKanbanBoard>
        <MosaicKanbanColumn title="Todo">
          <span>Card 1</span>
        </MosaicKanbanColumn>
        <MosaicKanbanColumn title="Done">
          <span>Card 2</span>
        </MosaicKanbanColumn>
      </MosaicKanbanBoard>,
    );
    const columns = document.querySelectorAll("[data-slot='kanban-column']");
    expect(columns.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts a custom className", () => {
    render(
      <MosaicKanbanBoard data-testid="board" className="custom-class">
        children
      </MosaicKanbanBoard>,
    );
    const board = screen.getByTestId("board");
    expect(board.className).toContain("custom-class");
  });
});

// ── MosaicKanbanColumn ────────────────────────────────────────────────────────

describe("MosaicKanbanColumn", () => {
  it("renders the title", () => {
    render(
      <MosaicKanbanColumn title="Backlog">
        <span>Card A</span>
      </MosaicKanbanColumn>,
    );
    expect(screen.getByText("Backlog")).toBeTruthy();
  });

  it("renders children cards", () => {
    render(
      <MosaicKanbanColumn title="In Progress">
        <div data-testid="card-1">Task 1</div>
        <div data-testid="card-2">Task 2</div>
      </MosaicKanbanColumn>,
    );
    expect(screen.getByTestId("card-1")).toBeTruthy();
    expect(screen.getByTestId("card-2")).toBeTruthy();
  });

  it("renders count badge when count prop is provided", () => {
    render(
      <MosaicKanbanColumn title="Todo" count={5}>
        children
      </MosaicKanbanColumn>,
    );
    expect(screen.getByText("5")).toBeTruthy();
    const badge = screen.getByText("5");
    expect(badge.getAttribute("data-slot")).toBe("kanban-column-count");
  });

  it("does NOT render count badge when count is omitted", () => {
    render(<MosaicKanbanColumn title="Empty">children</MosaicKanbanColumn>);
    // Badge element absent — no element with data-slot="kanban-column-count"
    const badge = document.querySelector("[data-slot='kanban-column-count']");
    expect(badge).toBeNull();
  });

  it("renders headerActions slot", () => {
    render(
      <MosaicKanbanColumn
        title="Todo"
        headerActions={
          <button type="button" data-testid="add-btn">
            +
          </button>
        }
      >
        children
      </MosaicKanbanColumn>,
    );
    expect(screen.getByTestId("add-btn")).toBeTruthy();
  });

  it("renders footer when provided", () => {
    render(
      <MosaicKanbanColumn
        title="Todo"
        footer={
          <button type="button" data-testid="load-more">
            Load more
          </button>
        }
      >
        children
      </MosaicKanbanColumn>,
    );
    expect(screen.getByTestId("load-more")).toBeTruthy();
  });

  it("does NOT render footer when omitted", () => {
    render(<MosaicKanbanColumn title="Todo">children</MosaicKanbanColumn>);
    const footer = document.querySelector("[data-slot='kanban-column-footer']");
    expect(footer).toBeNull();
  });

  it("sets data-slot='kanban-column'", () => {
    render(<MosaicKanbanColumn title="Todo">children</MosaicKanbanColumn>);
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col).not.toBeNull();
    expect(col?.getAttribute("data-slot")).toBe("kanban-column");
  });

  it("renders as a <section> element", () => {
    render(<MosaicKanbanColumn title="Todo">children</MosaicKanbanColumn>);
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col?.tagName.toLowerCase()).toBe("section");
  });

  it("accepts a custom className", () => {
    render(
      <MosaicKanbanColumn title="Todo" className="my-custom">
        children
      </MosaicKanbanColumn>,
    );
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col?.className).toContain("my-custom");
  });

  it("count badge has aria-label with item count", () => {
    render(
      <MosaicKanbanColumn title="Todo" count={7}>
        children
      </MosaicKanbanColumn>,
    );
    const badge = document.querySelector("[data-slot='kanban-column-count']");
    expect(badge?.getAttribute("aria-label")).toBe("7 items");
  });

  it("uses countLabel prop for localized aria-label (FR consumer)", () => {
    render(
      <MosaicKanbanColumn title="À faire" count={3} countLabel={(n) => `${n} éléments`}>
        children
      </MosaicKanbanColumn>,
    );
    const badge = document.querySelector("[data-slot='kanban-column-count']");
    expect(badge?.getAttribute("aria-label")).toBe("3 éléments");
  });
});
