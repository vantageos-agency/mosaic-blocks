import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardLayout } from "./MosaicDashboardLayout.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicDashboardLayout", () => {
  it("renders children", () => {
    render(
      <Wrapper>
        <MosaicDashboardLayout>
          <p>Page content</p>
        </MosaicDashboardLayout>
      </Wrapper>,
    );
    expect(screen.getByText("Page content")).toBeTruthy();
  });

  it("renders title when provided", () => {
    render(
      <Wrapper>
        <MosaicDashboardLayout title="My Dashboard">
          <p>Content</p>
        </MosaicDashboardLayout>
      </Wrapper>,
    );
    expect(screen.getByText("My Dashboard")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    render(
      <Wrapper>
        <MosaicDashboardLayout title="Dashboard" subtitle="Welcome back">
          <p>Content</p>
        </MosaicDashboardLayout>
      </Wrapper>,
    );
    expect(screen.getByText("Welcome back")).toBeTruthy();
  });

  it("renders breadcrumbs when provided", () => {
    render(
      <Wrapper>
        <MosaicDashboardLayout breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports" }]}>
          <p>Content</p>
        </MosaicDashboardLayout>
      </Wrapper>,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Reports")).toBeTruthy();
  });

  it("has data-slot on root element", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardLayout>
          <p>X</p>
        </MosaicDashboardLayout>
      </Wrapper>,
    );
    expect(container.querySelector('[data-slot="dashboard-layout"]')).toBeTruthy();
  });

  it("has displayName set", () => {
    expect(MosaicDashboardLayout.displayName).toBe("MosaicDashboardLayout");
  });
});
