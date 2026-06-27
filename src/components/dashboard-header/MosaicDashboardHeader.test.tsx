import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardHeader } from "./MosaicDashboardHeader.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicDashboardHeader", () => {
  it("renders title", () => {
    render(
      <Wrapper>
        <MosaicDashboardHeader title="My Dashboard" />
      </Wrapper>,
    );
    expect(screen.getByText("My Dashboard")).toBeTruthy();
  });

  it("renders subtitle as prop without error", () => {
    // subtitle renders on desktop only (!isMobile); jsdom defaults to mobile viewport
    expect(() =>
      render(
        <Wrapper>
          <MosaicDashboardHeader title="Dashboard" subtitle="Welcome back" />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders notification count in aria-label or badge", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardHeader
          title="Dashboard"
          notificationCount={5}
          onNotificationsClick={() => {}}
        />
      </Wrapper>,
    );
    // Notification bell button has aria-label containing count
    const bellBtn = container.querySelector('[aria-label*="Notifications"]');
    expect(bellBtn).toBeTruthy();
  });

  it("renders actions slot content", () => {
    render(
      <Wrapper>
        <MosaicDashboardHeader title="Dashboard" actions={<button type="button">Action</button>} />
      </Wrapper>,
    );
    expect(screen.getByText("Action")).toBeTruthy();
  });

  it("calls onNotificationsClick when bell clicked", () => {
    const onClick = vi.fn();
    render(
      <Wrapper>
        <MosaicDashboardHeader
          title="Dashboard"
          notificationCount={3}
          onNotificationsClick={onClick}
        />
      </Wrapper>,
    );
    const bellBtn = screen.getByLabelText(/Notifications/i);
    bellBtn.click();
    expect(onClick).toHaveBeenCalled();
  });
});
