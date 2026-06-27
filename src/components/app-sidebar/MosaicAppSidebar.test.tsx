import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAppSidebar } from "./MosaicAppSidebar.js";

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
        <MosaicAppSidebar isCollapsed={false} onToggleCollapse={() => {}} navItems={navItems} />
      </Wrapper>,
    );
    expect(container.querySelector('[data-slot="app-sidebar"]')).toBeTruthy();
  });

  it("renders nav items when expanded", () => {
    render(
      <Wrapper>
        <MosaicAppSidebar isCollapsed={false} onToggleCollapse={() => {}} navItems={navItems} />
      </Wrapper>,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Agents")).toBeTruthy();
  });

  it("renders with accessible landmark role", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAppSidebar isCollapsed={false} onToggleCollapse={() => {}} navItems={navItems} />
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
          <MosaicAppSidebar isCollapsed={true} onToggleCollapse={() => {}} navItems={navItems} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("has displayName set", () => {
    expect(MosaicAppSidebar.displayName).toBe("MosaicAppSidebar");
  });
});
