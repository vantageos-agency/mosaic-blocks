import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicClerkOrgSwitcher } from "./MosaicClerkOrgSwitcher.js";

// ── Mock Clerk OrganizationSwitcher ───────────────────────────────────────────

function MockOrgSwitcher({
  appearance,
  afterCreateOrganizationUrl,
  afterSelectOrganizationUrl,
  hidePersonal,
}: {
  appearance?: Record<string, unknown>;
  afterCreateOrganizationUrl?: string;
  afterSelectOrganizationUrl?: string;
  hidePersonal?: boolean;
}) {
  return (
    <div
      data-testid="clerk-org-switcher"
      data-has-appearance={appearance ? "true" : "false"}
      data-after-create={afterCreateOrganizationUrl}
      data-after-select={afterSelectOrganizationUrl}
      data-hide-personal={String(hidePersonal)}
    >
      Org Switcher
    </div>
  );
}

describe("MosaicClerkOrgSwitcher", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} />);
    unmount();
  });

  it("renders the Clerk OrganizationSwitcher widget", () => {
    render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} />);
    expect(screen.getByTestId("clerk-org-switcher")).toBeTruthy();
  });

  it("passes OKLCH appearance to Clerk OrganizationSwitcher", () => {
    render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} />);
    const widget = screen.getByTestId("clerk-org-switcher");
    expect(widget.getAttribute("data-has-appearance")).toBe("true");
  });

  it("passes afterCreateOrganizationUrl prop", () => {
    render(
      <MosaicClerkOrgSwitcher
        clerkOrgSwitcher={MockOrgSwitcher}
        afterCreateOrganizationUrl="/orgs/new"
      />,
    );
    const widget = screen.getByTestId("clerk-org-switcher");
    expect(widget.getAttribute("data-after-create")).toBe("/orgs/new");
  });

  it("passes afterSelectOrganizationUrl prop", () => {
    render(
      <MosaicClerkOrgSwitcher
        clerkOrgSwitcher={MockOrgSwitcher}
        afterSelectOrganizationUrl="/dashboard"
      />,
    );
    const widget = screen.getByTestId("clerk-org-switcher");
    expect(widget.getAttribute("data-after-select")).toBe("/dashboard");
  });

  it("passes hidePersonal prop", () => {
    render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} hidePersonal />);
    const widget = screen.getByTestId("clerk-org-switcher");
    expect(widget.getAttribute("data-hide-personal")).toBe("true");
  });

  it("renders data-slot on root wrapper", () => {
    const { container } = render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} />);
    expect(container.querySelector('[data-slot="clerk-org-switcher"]')).toBeTruthy();
  });

  it("has displayName set", () => {
    expect(MosaicClerkOrgSwitcher.displayName).toBe("MosaicClerkOrgSwitcher");
  });

  it("accepts custom className on wrapper", () => {
    const { container } = render(
      <MosaicClerkOrgSwitcher clerkOrgSwitcher={MockOrgSwitcher} className="my-custom-cls" />,
    );
    const root = container.querySelector('[data-slot="clerk-org-switcher"]');
    expect(root?.className).toContain("my-custom-cls");
  });

  it("mocks Clerk — no real ClerkProvider needed", () => {
    const mockFn = vi.fn(() => <div data-testid="mock-os">OS</div>);
    render(<MosaicClerkOrgSwitcher clerkOrgSwitcher={mockFn} />);
    expect(screen.getByTestId("mock-os")).toBeTruthy();
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
