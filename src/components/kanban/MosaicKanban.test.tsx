/**
 * MosaicKanbanBoard + MosaicKanbanColumn — vitest tests
 *
 * Follows Button.test.tsx conventions:
 * - @testing-library/react render + screen
 * - vitest describe/it/expect
 * - No "same key" warnings in stderr (no array index keys)
 *
 * i18n pilot: countLabel is a REQUIRED prop — host owns the language, no
 * English default lives in the component.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicKanbanBoard } from "./MosaicKanbanBoard.js";
import { MosaicKanbanColumn } from "./MosaicKanbanColumn.js";

const frCountLabel = (n: number) => `${n} éléments`;

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
        <MosaicKanbanColumn title="Todo" countLabel={frCountLabel}>
          <span>Card 1</span>
        </MosaicKanbanColumn>
        <MosaicKanbanColumn title="Done" countLabel={frCountLabel}>
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
      <MosaicKanbanColumn title="Backlog" countLabel={frCountLabel}>
        <span>Card A</span>
      </MosaicKanbanColumn>,
    );
    expect(screen.getByText("Backlog")).toBeTruthy();
  });

  it("renders children cards", () => {
    render(
      <MosaicKanbanColumn title="In Progress" countLabel={frCountLabel}>
        <div data-testid="card-1">Task 1</div>
        <div data-testid="card-2">Task 2</div>
      </MosaicKanbanColumn>,
    );
    expect(screen.getByTestId("card-1")).toBeTruthy();
    expect(screen.getByTestId("card-2")).toBeTruthy();
  });

  it("renders count badge when count prop is provided", () => {
    render(
      <MosaicKanbanColumn title="Todo" count={5} countLabel={frCountLabel}>
        children
      </MosaicKanbanColumn>,
    );
    expect(screen.getByText("5")).toBeTruthy();
    const badge = screen.getByText("5");
    expect(badge.getAttribute("data-slot")).toBe("kanban-column-count");
  });

  it("does NOT render count badge when count is omitted", () => {
    render(
      <MosaicKanbanColumn title="Empty" countLabel={frCountLabel}>
        children
      </MosaicKanbanColumn>,
    );
    // Badge element absent — no element with data-slot="kanban-column-count"
    const badge = document.querySelector("[data-slot='kanban-column-count']");
    expect(badge).toBeNull();
  });

  it("renders headerActions slot", () => {
    render(
      <MosaicKanbanColumn
        title="Todo"
        countLabel={frCountLabel}
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
        countLabel={frCountLabel}
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
    render(
      <MosaicKanbanColumn title="Todo" countLabel={frCountLabel}>
        children
      </MosaicKanbanColumn>,
    );
    const footer = document.querySelector("[data-slot='kanban-column-footer']");
    expect(footer).toBeNull();
  });

  it("sets data-slot='kanban-column'", () => {
    render(
      <MosaicKanbanColumn title="Todo" countLabel={frCountLabel}>
        children
      </MosaicKanbanColumn>,
    );
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col).not.toBeNull();
    expect(col?.getAttribute("data-slot")).toBe("kanban-column");
  });

  it("renders as a <section> element", () => {
    render(
      <MosaicKanbanColumn title="Todo" countLabel={frCountLabel}>
        children
      </MosaicKanbanColumn>,
    );
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col?.tagName.toLowerCase()).toBe("section");
  });

  it("accepts a custom className", () => {
    render(
      <MosaicKanbanColumn title="Todo" countLabel={frCountLabel} className="my-custom">
        children
      </MosaicKanbanColumn>,
    );
    const col = document.querySelector("[data-slot='kanban-column']");
    expect(col?.className).toContain("my-custom");
  });

  it("uses the host-provided countLabel for the count aria-label (FR consumer)", () => {
    render(
      <MosaicKanbanColumn title="À faire" count={3} countLabel={(n) => `${n} éléments`}>
        children
      </MosaicKanbanColumn>,
    );
    const badge = document.querySelector("[data-slot='kanban-column-count']");
    expect(badge?.getAttribute("aria-label")).toBe("3 éléments");
    expect(badge?.getAttribute("aria-label")).not.toBe("3 items");
  });
});

// ── i18n guard: zero hardcoded English left in source ────────────────────────

describe("i18n guard — no hardcoded English strings", () => {
  const dirName = dirname(fileURLToPath(import.meta.url));
  const attrPattern = /(aria-label|title|placeholder|alt)=(?!\{)"[A-Za-z][^"]*"/g;

  it("MosaicKanbanColumn.tsx has zero hardcoded aria-label/title/placeholder/alt strings", () => {
    const source = readFileSync(join(dirName, "MosaicKanbanColumn.tsx"), "utf-8");
    const codeOnly = stripComments(source);
    const matches = codeOnly.match(attrPattern) ?? [];
    expect(matches).toEqual([]);
  });
});

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}
