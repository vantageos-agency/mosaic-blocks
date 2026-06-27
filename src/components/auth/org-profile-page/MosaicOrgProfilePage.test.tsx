import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicOrgProfilePage } from "./MosaicOrgProfilePage.js";

// ── Mock Clerk OrganizationProfile ────────────────────────────────────────────

function MockOrgProfile({
  appearance,
  routing,
  path,
}: {
  appearance?: Record<string, unknown>;
  routing?: string;
  path?: string;
}) {
  return (
    <div
      data-testid="clerk-org-profile"
      data-has-appearance={appearance ? "true" : "false"}
      data-routing={routing}
      data-path={path}
    >
      Org Profile
    </div>
  );
}

describe("MosaicOrgProfilePage", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    unmount();
  });

  it("renders the Clerk OrganizationProfile widget", () => {
    render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    expect(screen.getByTestId("clerk-org-profile")).toBeTruthy();
  });

  it("passes OKLCH appearance to Clerk OrganizationProfile", () => {
    render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    const widget = screen.getByTestId("clerk-org-profile");
    expect(widget.getAttribute("data-has-appearance")).toBe("true");
  });

  it("defaults to hash routing", () => {
    render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    const widget = screen.getByTestId("clerk-org-profile");
    expect(widget.getAttribute("data-routing")).toBe("hash");
  });

  it("passes path routing mode", () => {
    render(
      <MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} routing="path" path="/org/settings" />,
    );
    const widget = screen.getByTestId("clerk-org-profile");
    expect(widget.getAttribute("data-routing")).toBe("path");
    expect(widget.getAttribute("data-path")).toBe("/org/settings");
  });

  it("renders data-slot on root wrapper", () => {
    const { container } = render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    expect(container.querySelector('[data-slot="org-profile-page"]')).toBeTruthy();
  });

  it("root has bg-background semantic class", () => {
    const { container } = render(<MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} />);
    const root = container.querySelector('[data-slot="org-profile-page"]');
    expect(root?.className).toContain("bg-background");
  });

  it("has displayName set", () => {
    expect(MosaicOrgProfilePage.displayName).toBe("MosaicOrgProfilePage");
  });

  it("accepts custom className on wrapper", () => {
    const { container } = render(
      <MosaicOrgProfilePage clerkOrgProfile={MockOrgProfile} className="full-page" />,
    );
    const root = container.querySelector('[data-slot="org-profile-page"]');
    expect(root?.className).toContain("full-page");
  });

  it("mocks Clerk — no real ClerkProvider needed", () => {
    const mockFn = vi.fn(() => <div data-testid="mock-op">OP</div>);
    render(<MosaicOrgProfilePage clerkOrgProfile={mockFn} />);
    expect(screen.getByTestId("mock-op")).toBeTruthy();
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
