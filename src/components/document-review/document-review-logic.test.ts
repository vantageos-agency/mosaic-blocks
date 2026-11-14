/**
 * document-review — stack-free review logic tests.
 *
 * Covers: panel tab (Compare is the initial tab), prev/next row navigation,
 * field correction with provenance (original kept, failed write restores the
 * row, uncertain write is flagged), and the generic column model (visibility).
 */
import { describe, expect, it, vi } from "vitest";
import {
  INITIAL_REVIEW_PANEL_TAB,
  REVIEW_PANEL_TABS,
  applyFieldCorrection,
  correctionOutcome,
  initialColumnVisibility,
  isEditableTarget,
  neighbourRowId,
  toggleColumnVisibility,
  visibleColumns,
} from "./document-review-logic.js";
import type { ReviewColumn, ReviewRow } from "./document-review-logic.js";

const columns: ReviewColumn<ReviewRow>[] = [
  { id: "a", label: "A", defaultVisible: true, accessor: (r) => r.values.a ?? null },
  { id: "b", label: "B", defaultVisible: false, accessor: (r) => r.values.b ?? null },
  {
    id: "c",
    label: "C",
    defaultVisible: true,
    accessor: (r) => r.values.c ?? null,
    editable: false,
  },
];

const row: ReviewRow = { id: "r1", values: { a: "one", b: 2, c: null } };

describe("panel tab", () => {
  it("the initial tab is compare, and compare is one of the tabs", () => {
    expect(INITIAL_REVIEW_PANEL_TAB).toBe("compare");
    expect(REVIEW_PANEL_TABS).toContain("compare");
    expect(REVIEW_PANEL_TABS).toEqual(["compare", "document", "row"]);
  });
});

describe("neighbourRowId", () => {
  const ids = ["x", "y", "z"];
  it("returns the next and previous neighbour", () => {
    expect(neighbourRowId(ids, "y", "next")).toBe("z");
    expect(neighbourRowId(ids, "y", "prev")).toBe("x");
  });
  it("returns null at either end and for an unlisted id", () => {
    expect(neighbourRowId(ids, "z", "next")).toBeNull();
    expect(neighbourRowId(ids, "x", "prev")).toBeNull();
    expect(neighbourRowId(ids, "nope", "next")).toBeNull();
  });
  it("isEditableTarget is true for input/textarea/select, false otherwise", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("column model", () => {
  it("initial visibility is the declared default", () => {
    expect(initialColumnVisibility(columns)).toEqual({ a: true, b: false, c: true });
  });
  it("visibleColumns honours the visibility map, in column order", () => {
    expect(visibleColumns(columns, initialColumnVisibility(columns)).map((c) => c.id)).toEqual([
      "a",
      "c",
    ]);
    expect(visibleColumns(columns, { b: true, a: false }).map((c) => c.id)).toEqual(["b", "c"]);
  });
  it("toggleColumnVisibility flips one column without mutating the input", () => {
    const base = initialColumnVisibility(columns);
    const next = toggleColumnVisibility(columns, base, "b");
    expect(next.b).toBe(true);
    expect(base.b).toBe(false);
  });
  it("refuses loudly a visibility key that names no column", () => {
    expect(() => visibleColumns(columns, { ghost: true })).toThrow(/ghost/);
    expect(() => toggleColumnVisibility(columns, {}, "ghost")).toThrow(/ghost/);
  });
});

describe("applyFieldCorrection", () => {
  const base = { row, field: "a", input: "uno", by: "reviewer-1", provenance: "manual" };

  it("success keeps the original, stores corrected + who/when/provenance, never mutates the row", async () => {
    const write = vi.fn().mockResolvedValue({ ok: true, value: "uno" });
    const r = await applyFieldCorrection({
      ...base,
      write,
      now: () => "2026-01-02T03:04:05.000Z",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.row.values.a).toBe("uno");
    expect(r.row.corrections?.a).toEqual({
      original: "one",
      corrected: "uno",
      by: "reviewer-1",
      at: "2026-01-02T03:04:05.000Z",
      provenance: "manual",
    });
    expect(row.values.a).toBe("one");
    expect(row.corrections).toBeUndefined();
    expect(write).toHaveBeenCalledWith({
      rowId: "r1",
      field: "a",
      input: "uno",
      by: "reviewer-1",
      provenance: "manual",
    });
    expect(r.confirmed).toBe(true);
    expect(correctionOutcome(r)).toBe("ok");
  });

  it("a second correction keeps the FIRST original", async () => {
    const write = vi.fn().mockResolvedValue({ ok: true, value: "dos" });
    const first = await applyFieldCorrection({
      ...base,
      write: async () => ({ ok: true, value: "uno" }),
    });
    if (!first.ok) throw new Error("first must succeed");
    const second = await applyFieldCorrection({ ...base, row: first.row, input: "dos", write });
    if (!second.ok) throw new Error("second must succeed");
    expect(second.row.corrections?.a?.original).toBe("one");
    expect(second.row.corrections?.a?.corrected).toBe("dos");
  });

  it("a validator refusal never reaches the writer and returns the same row", async () => {
    const write = vi.fn();
    const r = await applyFieldCorrection({
      ...base,
      write,
      validate: () => ({ ok: false, message: "bad" }),
    });
    expect(write).not.toHaveBeenCalled();
    expect(r).toEqual({ ok: false, row, message: "bad" });
    expect(correctionOutcome(r)).toBe("failed");
  });

  it("a refused write returns the row from BEFORE, with the refusal message", async () => {
    const r = await applyFieldCorrection({
      ...base,
      write: async () => ({ ok: false, message: "server said no" }),
    });
    expect(r.ok).toBe(false);
    expect(r.row).toBe(row);
    if (!r.ok) expect(r.message).toBe("server said no");
  });

  it("a thrown write is a refusal carrying the thrown message verbatim", async () => {
    const r = await applyFieldCorrection({
      ...base,
      write: async () => {
        throw new Error("network down");
      },
    });
    expect(r).toEqual({ ok: false, row, message: "network down" });
  });

  it("a write that does not echo the value is flagged uncertain, and shows what was sent", async () => {
    const r = await applyFieldCorrection({ ...base, write: async () => ({ ok: true }) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.confirmed).toBe(false);
    expect(r.row.values.a).toBe("uno");
    expect(correctionOutcome(r)).toBe("uncertain");
  });

  it("an echoed null is a confirmation of erasure, not a silence", async () => {
    const r = await applyFieldCorrection({
      ...base,
      write: async () => ({ ok: true, value: null }),
    });
    if (!r.ok) throw new Error("must succeed");
    expect(r.confirmed).toBe(true);
    expect(r.row.values.a).toBeNull();
    expect(r.row.corrections?.a?.corrected).toBeNull();
  });

  it("uses the server-echoed value, not the typed one, when they differ", async () => {
    const r = await applyFieldCorrection({
      ...base,
      input: "2026-06-15",
      write: async () => ({ ok: true, value: "15/06/2026" }),
    });
    if (!r.ok) throw new Error("must succeed");
    expect(r.row.values.a).toBe("15/06/2026");
  });
});
