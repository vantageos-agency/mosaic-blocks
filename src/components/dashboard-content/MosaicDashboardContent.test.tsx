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
        <MosaicDashboardContent
          views={views}
          currentView="overview"
          viewNotFoundLabel="View not found: "
        />
      </Wrapper>,
    );
    expect(screen.getByText("Overview content here")).toBeTruthy();
  });

  it("renders different view when currentView changes", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent
          views={views}
          currentView="details"
          viewNotFoundLabel="View not found: "
        />
      </Wrapper>,
    );
    expect(screen.getByText("Details content here")).toBeTruthy();
  });

  it("renders with empty views without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicDashboardContent views={[]} currentView="" viewNotFoundLabel="View not found: " />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardContent
          views={views}
          currentView="overview"
          viewNotFoundLabel="View not found: "
          className="my-content"
        />
      </Wrapper>,
    );
    expect(container.querySelector(".my-content")).toBeTruthy();
  });

  it("shows not found message for unknown view", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent
          views={views}
          currentView="nonexistent"
          viewNotFoundLabel="View not found: "
        />
      </Wrapper>,
    );
    expect(screen.getByText(/View not found/i)).toBeTruthy();
  });

  it("renders the host-supplied view-not-found label and fabricates no word of its own", () => {
    render(
      <Wrapper>
        <MosaicDashboardContent
          views={views}
          currentView="nonexistent"
          viewNotFoundLabel="Vue introuvable : "
        />
      </Wrapper>,
    );
    expect(screen.getByText(/Vue introuvable/i)).toBeTruthy();
    expect(screen.queryByText(/View not found/i)).toBeNull();
  });
});
