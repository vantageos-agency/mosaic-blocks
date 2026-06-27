import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardContent } from "./MosaicDashboardContent.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const views = [
  { id: "overview", label: "Overview", content: <p>Overview content here</p> },
  { id: "details", label: "Details", content: <p>Details content here</p> },
];

describe("MosaicDashboardContent", () => {
  it("renders active view content", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent views={views} currentView="overview" />
      </Wrapper>,
    );
    expect(screen.getByText("Overview content here")).toBeTruthy();
  });

  it("renders different view when currentView changes", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent views={views} currentView="details" />
      </Wrapper>,
    );
    expect(screen.getByText("Details content here")).toBeTruthy();
  });

  it("renders with empty views without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicDashboardContent views={[]} currentView="" />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardContent views={views} currentView="overview" className="my-content" />
      </Wrapper>,
    );
    expect(container.querySelector(".my-content")).toBeTruthy();
  });

  it("shows not found message for unknown view", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent views={views} currentView="nonexistent" />
      </Wrapper>,
    );
    expect(screen.getByText(/View not found/i)).toBeTruthy();
  });
});
