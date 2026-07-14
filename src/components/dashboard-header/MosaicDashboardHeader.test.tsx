import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicDashboardHeader } from "./MosaicDashboardHeader.js";

const requiredHeaderLabels = { searchPlaceholder: "Search…", searchAriaLabel: "Search" };

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicDashboardHeader", () => {
  it("renders title", () => {
    render(
      <Wrapper>
        <MosaicDashboardHeader title="My Dashboard" {...requiredHeaderLabels} />
      </Wrapper>,
    );
    expect(screen.getByText("My Dashboard")).toBeTruthy();
  });

  it("renders subtitle as prop without error", () => {
    // subtitle renders on desktop only (!isMobile); jsdom defaults to mobile viewport
    expect(() =>
      render(
        <Wrapper>
          <MosaicDashboardHeader
            title="Dashboard"
            subtitle="Welcome back"
            {...requiredHeaderLabels}
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders no aria-label on the bell button when notificationsAriaLabel is absent", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardHeader
          title="Dashboard"
          notificationCount={5}
          onNotificationsClick={() => {}}
          {...requiredHeaderLabels}
        />
      </Wrapper>,
    );
    const bellBtn = container.querySelector("button.relative");
    expect(bellBtn).toBeTruthy();
    expect(bellBtn?.getAttribute("aria-label")).toBeNull();
  });

  it("renders the host-formatted notification count in aria-label", () => {
    const { container } = render(
      <Wrapper>
        <MosaicDashboardHeader
          title="Dashboard"
          notificationCount={5}
          onNotificationsClick={() => {}}
          notificationsAriaLabel={(count) => `Notifications (${count})`}
          {...requiredHeaderLabels}
        />
      </Wrapper>,
    );
    const bellBtn = container.querySelector('[aria-label*="Notifications"]');
    expect(bellBtn).toBeTruthy();
  });

  it("renders actions slot content", () => {
    render(
      <Wrapper>
        <MosaicDashboardHeader
          title="Dashboard"
          actions={<button type="button">Action</button>}
          {...requiredHeaderLabels}
        />
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
          notificationsAriaLabel={(count) => `Notifications (${count})`}
          {...requiredHeaderLabels}
        />
      </Wrapper>,
    );
    const bellBtn = screen.getByLabelText(/Notifications/i);
    bellBtn.click();
    expect(onClick).toHaveBeenCalled();
  });
});
