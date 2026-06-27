import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAdaptiveGrid } from "./MosaicAdaptiveGrid.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicAdaptiveGrid", () => {
  it("renders children", () => {
    render(
      <Wrapper>
        <MosaicAdaptiveGrid>
          <div>Item A</div>
          <div>Item B</div>
        </MosaicAdaptiveGrid>
      </Wrapper>,
    );
    expect(screen.getByText("Item A")).toBeTruthy();
    expect(screen.getByText("Item B")).toBeTruthy();
  });

  it("renders a div grid container", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAdaptiveGrid>
          <div>Cell</div>
        </MosaicAdaptiveGrid>
      </Wrapper>,
    );
    const grid = container.querySelector("div");
    expect(grid).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAdaptiveGrid className="my-grid">
          <div>X</div>
        </MosaicAdaptiveGrid>
      </Wrapper>,
    );
    const grid = container.querySelector(".my-grid");
    expect(grid).toBeTruthy();
  });

  it("accepts mobileColumns, tabletColumns, desktopColumns props without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAdaptiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={4}>
            <div>Col</div>
          </MosaicAdaptiveGrid>
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders multiple children correctly", () => {
    render(
      <Wrapper>
        <MosaicAdaptiveGrid>
          {["a", "b", "c"].map((k) => (
            <div key={k}>{k}</div>
          ))}
        </MosaicAdaptiveGrid>
      </Wrapper>,
    );
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("c")).toBeTruthy();
  });
});
