/**
 * MosaicKpiTile — unit tests (vitest + @testing-library/react)
 *
 * Follows the MosaicAppSidebar.test.tsx / MosaicSkeleton.test.tsx pattern.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicKpiTile } from "./MosaicKpiTile.js";

describe("MosaicKpiTile", () => {
  it("renders with data-slot='kpi-tile'", () => {
    const { container } = render(<MosaicKpiTile label="Baux actifs" value="127" />);
    expect(container.querySelector('[data-slot="kpi-tile"]')).toBeTruthy();
  });

  it("renders label and value", () => {
    render(<MosaicKpiTile label="Baux actifs" value="127" />);
    expect(screen.getByText("Baux actifs")).toBeTruthy();
    expect(screen.getByText("127")).toBeTruthy();
  });

  it("renders the icon in an icon well", () => {
    const { container } = render(
      <MosaicKpiTile label="Baux actifs" value="127" icon={<svg data-testid="icon" />} />,
    );
    const well = container.querySelector('[data-slot="kpi-tile-icon-well"]');
    expect(well).toBeTruthy();
    expect(well?.querySelector('[data-testid="icon"]')).toBeTruthy();
  });

  it("renders a trend slot with success semantic coloring when direction is up", () => {
    const { container } = render(
      <MosaicKpiTile label="Baux actifs" value="127" trend={{ direction: "up", label: "+12%" }} />,
    );
    const trend = container.querySelector('[data-slot="kpi-tile-trend"]');
    expect(trend).toBeTruthy();
    expect(trend?.getAttribute("data-trend")).toBe("up");
    expect(trend?.className).toContain("success-500");
    expect(screen.getByText("+12%")).toBeTruthy();
  });

  it("renders a trend slot with danger semantic coloring when direction is down", () => {
    const { container } = render(
      <MosaicKpiTile label="Baux actifs" value="127" trend={{ direction: "down", label: "-4%" }} />,
    );
    const trend = container.querySelector('[data-slot="kpi-tile-trend"]');
    expect(trend?.getAttribute("data-trend")).toBe("down");
    expect(trend?.className).toContain("danger-500");
  });

  it("renders an inline SVG sparkline when sparklineData is provided", () => {
    const { container } = render(
      <MosaicKpiTile label="Baux actifs" value="127" sparklineData={[1, 4, 2, 8, 5, 9]} />,
    );
    const sparkline = container.querySelector('[data-slot="kpi-tile-sparkline"]');
    expect(sparkline).toBeTruthy();
    expect(sparkline?.tagName.toLowerCase()).toBe("svg");
    expect(sparkline?.querySelector("polyline")).toBeTruthy();
  });

  it("renders a loading skeleton state instead of label/value when isLoading", () => {
    const { container } = render(<MosaicKpiTile label="Baux actifs" value="127" isLoading />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    expect(screen.queryByText("127")).toBeNull();
  });

  it("renders a 'not connected' state with the caller-supplied FR label", () => {
    render(
      <MosaicKpiTile
        label="Baux actifs"
        value="127"
        isConnected={false}
        notConnectedLabel="Non raccordé"
      />,
    );
    expect(screen.getByText("Non raccordé")).toBeTruthy();
    expect(screen.queryByText("127")).toBeNull();
  });

  it("renders a 'not connected' state with the caller-supplied EN label", () => {
    render(
      <MosaicKpiTile
        label="Active leases"
        value="127"
        isConnected={false}
        notConnectedLabel="Not connected"
      />,
    );
    expect(screen.getByText("Not connected")).toBeTruthy();
  });

  it("has displayName set", () => {
    expect(MosaicKpiTile.displayName).toBe("MosaicKpiTile");
  });

  it("wires entry and hover-lift motion to the shared token-driven classes (reduced-motion proof)", () => {
    // depth.css zeroes .mosaic-motion-entry / .mosaic-motion-hover-lift under
    // prefers-reduced-motion: reduce. The component's proof of correctness is
    // that it WIRES to those shared classes rather than declaring its own
    // duration — never a hardcoded animation/transition of its own.
    const { container } = render(<MosaicKpiTile label="Baux actifs" value="127" />);
    const root = container.querySelector('[data-slot="kpi-tile"]');
    expect(root?.className).toContain("mosaic-motion-entry");
    expect(root?.className).toContain("mosaic-motion-hover-lift");
  });
});
