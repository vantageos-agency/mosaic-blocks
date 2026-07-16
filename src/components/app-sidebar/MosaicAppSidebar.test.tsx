import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAppSidebar } from "./MosaicAppSidebar.js";

/** jsdom has no real viewport — mock matchMedia so the desktop (>= md) branch renders. */
function mockDesktopViewport() {
  const original = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return original;
}

const navItems = [
  { id: "home", label: "Home", href: "/" },
  { id: "agents", label: "Agents", href: "/agents" },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicAppSidebar", () => {
  it("renders with data-slot=app-sidebar", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeTruthy();
  });

  it("renders nav items when expanded", () => {
    render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Agents")).toBeTruthy();
  });

  it("renders with accessible landmark role", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    // aria-label on the root div makes it a region landmark
    const sidebar = container.querySelector('[aria-label="Application sidebar"]');
    expect(sidebar).toBeTruthy();
  });

  it("renders in collapsed state without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAppSidebar
            isCollapsed={true}
            onToggleCollapse={() => {}}
            navItems={navItems}
            sidebarAriaLabel="Application sidebar"
            mainNavAriaLabel="Main navigation"
            quickActionsHeading="Quick Actions"
            recentHeading="Recent"
            collapseSidebarAriaLabel="Collapse sidebar"
            expandSidebarAriaLabel="Expand sidebar"
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("has displayName set", () => {
    expect(MosaicAppSidebar.displayName).toBe("MosaicAppSidebar");
  });

  it("renders bottomNavItems anchored below the main nav zone", () => {
    const bottomNavItems = [{ id: "settings", label: "Settings", href: "/settings" }];
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          bottomNavAriaLabel="Secondary navigation"
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Settings")).toBeTruthy();
    const bottomZone = container.querySelector('[data-slot="app-sidebar-bottom-nav"]');
    expect(bottomZone).toBeTruthy();
    expect(bottomZone?.querySelector('[aria-label="Secondary navigation"]')).toBeTruthy();
  });

  it("navigates when a bottomNavItem is clicked", () => {
    const bottomNavItems = [{ id: "settings", label: "Settings", href: "/settings" }];
    let navigated: string | undefined;
    render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          bottomNavAriaLabel="Secondary navigation"
          onNavigate={(href) => {
            navigated = href;
          }}
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    screen.getByText("Settings").closest("button")?.click();
    expect(navigated).toBe("/settings");
  });

  it("renders the collapse toggle at the bottom when chevronPosition='bottom'", () => {
    const original = mockDesktopViewport();
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          chevronPosition="bottom"
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    const header = container.querySelector('[data-slot="app-sidebar"] > div:first-child');
    expect(header?.querySelector('[aria-label="Collapse sidebar"]')).toBeFalsy();
    const toggleZone = container.querySelector('[data-slot="app-sidebar-toggle-zone"]');
    expect(toggleZone).toBeTruthy();
    expect(toggleZone?.querySelector('[aria-label="Collapse sidebar"]')).toBeTruthy();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: original,
    });
  });

  it("defaults chevronPosition to 'top' — zero drift for existing consumers", () => {
    const original = mockDesktopViewport();
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          navItems={navItems}
          sidebarAriaLabel="Application sidebar"
          mainNavAriaLabel="Main navigation"
          quickActionsHeading="Quick Actions"
          recentHeading="Recent"
          collapseSidebarAriaLabel="Collapse sidebar"
          expandSidebarAriaLabel="Expand sidebar"
        />
      </Wrapper>,
    );
    const header = container.querySelector('[data-slot="app-sidebar"] > div:first-child');
    expect(header?.querySelector('[aria-label="Collapse sidebar"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="app-sidebar-toggle-zone"]')).toBeFalsy();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: original,
    });
  });
});
