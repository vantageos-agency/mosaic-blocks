import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMainNav } from "./MosaicMainNav.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

describe("MosaicMainNav", () => {
  it("renders nav items", () => {
    render(
      <Wrapper>
        <MosaicMainNav
          items={navItems}
          openMenuAriaLabel="Open navigation menu"
          closeMenuAriaLabel="Close navigation menu"
          drawerNavAriaLabel="Navigation"
          mainNavAriaLabel="Main navigation"
          adminBadgeLabel="Admin"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
  });

  it("hides adminOnly items when isAdmin=false", () => {
    render(
      <Wrapper>
        <MosaicMainNav
          items={navItems}
          isAdmin={false}
          openMenuAriaLabel="Open navigation menu"
          closeMenuAriaLabel="Close navigation menu"
          drawerNavAriaLabel="Navigation"
          mainNavAriaLabel="Main navigation"
          adminBadgeLabel="Admin"
        />
      </Wrapper>,
    );
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("shows adminOnly items when isAdmin=true", () => {
    render(
      <Wrapper>
        <MosaicMainNav
          items={navItems}
          isAdmin={true}
          openMenuAriaLabel="Open navigation menu"
          closeMenuAriaLabel="Close navigation menu"
          drawerNavAriaLabel="Navigation"
          mainNavAriaLabel="Main navigation"
          adminBadgeLabel="Admin"
        />
      </Wrapper>,
    );
    // "Admin" appears in nav items (may appear multiple times in mobile+desktop duplicated renderings)
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("uses renderLink when provided", () => {
    const renderLink = vi.fn(
      (item: { href: string }, children: React.ReactNode, className: string) => (
        <a href={item.href} className={className} data-testid="custom-link" key={item.href}>
          {children}
        </a>
      ),
    );
    render(
      <Wrapper>
        <MosaicMainNav
          items={navItems}
          renderLink={renderLink}
          openMenuAriaLabel="Open navigation menu"
          closeMenuAriaLabel="Close navigation menu"
          drawerNavAriaLabel="Navigation"
          mainNavAriaLabel="Main navigation"
          adminBadgeLabel="Admin"
        />
      </Wrapper>,
    );
    expect(renderLink).toHaveBeenCalled();
  });

  it("renders without items without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicMainNav
            items={[]}
            openMenuAriaLabel="Open navigation menu"
            closeMenuAriaLabel="Close navigation menu"
            drawerNavAriaLabel="Navigation"
            mainNavAriaLabel="Main navigation"
            adminBadgeLabel="Admin"
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });
});
