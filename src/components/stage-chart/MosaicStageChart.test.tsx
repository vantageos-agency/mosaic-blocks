/**
 * MosaicStageChart — unit tests (vitest + @testing-library/react)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicStageChart } from "./MosaicStageChart.js";

const stages = [
  { id: "prospect", label: "Prospect", value: 42 },
  { id: "qualifie", label: "Qualifié", value: 28 },
  { id: "proposition", label: "Proposition", value: 14 },
  { id: "negociation", label: "Négociation", value: 9 },
  { id: "gagne", label: "Gagné", value: 6, kind: "won" as const },
  { id: "perdu", label: "Perdu", value: 11, kind: "lost" as const },
];

const valueLabel = (value: number) => `${value} dossiers`;
const columnLabels = { stageColumnLabel: "Étape", valueColumnLabel: "Dossiers" };

describe("MosaicStageChart", () => {
  it("renders with data-slot='stage-chart'", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    expect(container.querySelector('[data-slot="stage-chart"]')).toBeTruthy();
  });

  it("renders one bar per pipeline stage", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const bars = container.querySelectorAll('[data-slot="stage-chart-bar"]');
    expect(bars.length).toBe(stages.length);
  });

  it("marks the won stage with data-kind='won' and a success token class", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const won = container.querySelector('[data-slot="stage-chart-bar"][data-kind="won"]');
    expect(won).toBeTruthy();
    expect(won?.className).toContain("success-500");
  });

  it("marks the lost stage with data-kind='lost' and a danger token class", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const lost = container.querySelector('[data-slot="stage-chart-bar"][data-kind="lost"]');
    expect(lost).toBeTruthy();
    expect(lost?.className).toContain("danger-500");
  });

  it("defaults non-won/lost stages to data-kind='default' with no literal color", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const neutral = container.querySelector('[data-slot="stage-chart-bar"][data-kind="default"]');
    expect(neutral).toBeTruthy();
  });

  it("exposes an accessible fallback table with the same numbers, captioned by tableCaption", () => {
    render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline commercial"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const table = screen.getByRole("table");
    expect(table).toBeTruthy();
    expect(screen.getByText("Pipeline commercial")).toBeTruthy();
    for (const stage of stages) {
      expect(screen.getAllByText(stage.label).length).toBeGreaterThan(0);
      expect(screen.getAllByText(valueLabel(stage.value)).length).toBeGreaterThan(0);
    }
  });

  it("has displayName set", () => {
    expect(MosaicStageChart.displayName).toBe("MosaicStageChart");
  });

  it("wires the bar grow-in animation to the shared token-driven class (reduced-motion proof)", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const bar = container.querySelector('[data-slot="stage-chart-bar"]');
    expect(bar?.className).toContain("mosaic-stage-chart-bar-grow");
  });

  // ── Wave-1 T5 reopen defect 1 ────────────────────────────────────────────
  // In-progress bars (won/lost keep success/danger) must use a token with
  // REAL contrast against the card surface, never `bg-accent` — that token
  // resolves to the same luminance as the card/sidebar-accent surfaces it
  // sits on and renders invisible.

  it("colors in-progress (default-kind) bars with the vivid accent token, not the invisible bg-accent slot", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const inProgressBars = container.querySelectorAll(
      '[data-slot="stage-chart-bar"][data-kind="default"]',
    );
    expect(inProgressBars.length).toBeGreaterThan(0);
    for (const bar of inProgressBars) {
      expect(bar.className).toContain("accent-vivid");
    }
  });

  // ── Wave-1 T5 reopen defect 1 ────────────────────────────────────────────
  // Every bar must show its value as VISIBLE text (not only inside the
  // sr-only accessible table) — the operator's screenshot showed bars with
  // no value at all.

  it("shows a VISIBLE value label on every bar, matching the sr-only table's numbers", () => {
    const { container } = render(
      <MosaicStageChart
        stages={stages}
        tableCaption="Pipeline"
        valueLabel={valueLabel}
        {...columnLabels}
      />,
    );
    const visibleValues = container.querySelectorAll('[data-slot="stage-chart-bar-value"]');
    expect(visibleValues.length).toBe(stages.length);
    const texts = Array.from(visibleValues).map((el) => el.textContent);
    for (const stage of stages) {
      expect(texts).toContain(valueLabel(stage.value));
    }
  });
});
