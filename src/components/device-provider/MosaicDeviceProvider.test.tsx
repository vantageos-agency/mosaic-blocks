import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider, useDevice } from "./MosaicDeviceProvider.js";

// ── Helper: consumer of useDevice ─────────────────────────────────────────────

function DeviceConsumer() {
  const device = useDevice();
  return (
    <div>
      <span data-testid="is-mobile">{String(device.isMobile)}</span>
      <span data-testid="is-tablet">{String(device.isTablet)}</span>
      <span data-testid="is-desktop">{String(device.isDesktop)}</span>
      <span data-testid="orientation">{device.orientation}</span>
      <span data-testid="vp-width">{String(device.viewport.width)}</span>
    </div>
  );
}

describe("MosaicDeviceProvider", () => {
  it("renders children without crashing", () => {
    render(
      <MosaicDeviceProvider>
        <p>hello</p>
      </MosaicDeviceProvider>,
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("provides boolean isMobile flag in context", () => {
    render(
      <MosaicDeviceProvider>
        <DeviceConsumer />
      </MosaicDeviceProvider>,
    );
    const val = screen.getByTestId("is-mobile").textContent;
    expect(val === "true" || val === "false").toBe(true);
  });

  it("provides orientation in context", () => {
    render(
      <MosaicDeviceProvider>
        <DeviceConsumer />
      </MosaicDeviceProvider>,
    );
    const orientation = screen.getByTestId("orientation").textContent;
    expect(orientation === "portrait" || orientation === "landscape").toBe(true);
  });

  it("provides viewport width as number", () => {
    render(
      <MosaicDeviceProvider>
        <DeviceConsumer />
      </MosaicDeviceProvider>,
    );
    const width = Number(screen.getByTestId("vp-width").textContent);
    expect(Number.isFinite(width)).toBe(true);
  });

  it("has displayName set", () => {
    expect(MosaicDeviceProvider.displayName).toBe("MosaicDeviceProvider");
  });
});
