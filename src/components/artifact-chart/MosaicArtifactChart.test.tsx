/**
 * MosaicArtifactChart — tests
 *
 * Coverage: renders title + type badge + point-count badge for bar/line/pie,
 * falls back to the required unsupported-type message for an unknown type,
 * data-slot anchors. Recharts' ResponsiveContainer needs real layout to
 * measure — jsdom reports 0×0, so these assert on the surrounding chrome
 * (title/badges/data-slot), not on rendered SVG geometry.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MosaicArtifactChartData } from "./MosaicArtifactChart.js";
import { MosaicArtifactChart } from "./MosaicArtifactChart.js";

const labels = {
  typeBadgeLabel: (type: string) => `${type} Chart`,
  pointsLabel: (n: number) => `${n} points`,
  unsupportedTypeMessage: (type: string) => `Unsupported chart type: ${type}`,
};

const barData: MosaicArtifactChartData = {
  title: "Q3 revenue",
  type: "bar",
  data: [
    { month: "Jul", value: 100 },
    { month: "Aug", value: 120 },
  ],
};

describe("MosaicArtifactChart", () => {
  it("renders title and type badge for a bar chart", () => {
    render(<MosaicArtifactChart data={barData} labels={labels} />);
    expect(screen.getByText("Q3 revenue")).toBeTruthy();
    expect(screen.getByText("bar Chart")).toBeTruthy();
    expect(screen.getByText("2 points")).toBeTruthy();
  });

  it("sets data-slot='artifact-chart' on root", () => {
    render(<MosaicArtifactChart data={barData} labels={labels} />);
    expect(document.querySelector("[data-slot='artifact-chart']")).toBeTruthy();
  });

  it("renders a line chart", () => {
    render(<MosaicArtifactChart data={{ ...barData, type: "line" }} labels={labels} />);
    expect(screen.getByText("line Chart")).toBeTruthy();
  });

  it("renders a pie chart", () => {
    render(
      <MosaicArtifactChart
        data={{ title: "Share", type: "pie", data: [{ name: "A", value: 60 }] }}
        labels={labels}
      />,
    );
    expect(screen.getByText("pie Chart")).toBeTruthy();
  });

  it("shows the required unsupported-type message for an unknown type", () => {
    render(
      <MosaicArtifactChart
        data={{ title: "X", type: "scatter" as unknown as "bar", data: [] }}
        labels={labels}
      />,
    );
    expect(screen.getByText("Unsupported chart type: scatter")).toBeTruthy();
  });
});
