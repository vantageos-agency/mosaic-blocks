import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicUserButton } from "./MosaicUserButton.js";

// ── Mock Clerk UserButton ─────────────────────────────────────────────────────

function MockUserButton({
  appearance,
  afterSignOutUrl,
  showName,
}: {
  appearance?: Record<string, unknown>;
  afterSignOutUrl?: string;
  showName?: boolean;
}) {
  return (
    <div
      data-testid="clerk-user-button"
      data-has-appearance={appearance ? "true" : "false"}
      data-after-signout={afterSignOutUrl}
      data-show-name={String(showName)}
    >
      User Button
    </div>
  );
}

describe("MosaicUserButton", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicUserButton clerkUserButton={MockUserButton} />);
    unmount();
  });

  it("renders the Clerk UserButton widget", () => {
    render(<MosaicUserButton clerkUserButton={MockUserButton} />);
    expect(screen.getByTestId("clerk-user-button")).toBeTruthy();
  });

  it("passes OKLCH appearance to Clerk UserButton", () => {
    render(<MosaicUserButton clerkUserButton={MockUserButton} />);
    const widget = screen.getByTestId("clerk-user-button");
    expect(widget.getAttribute("data-has-appearance")).toBe("true");
  });

  it("passes afterSignOutUrl prop", () => {
    render(<MosaicUserButton clerkUserButton={MockUserButton} afterSignOutUrl="/bye" />);
    const widget = screen.getByTestId("clerk-user-button");
    expect(widget.getAttribute("data-after-signout")).toBe("/bye");
  });

  it("passes showName prop", () => {
    render(<MosaicUserButton clerkUserButton={MockUserButton} showName />);
    const widget = screen.getByTestId("clerk-user-button");
    expect(widget.getAttribute("data-show-name")).toBe("true");
  });

  it("renders data-slot on root wrapper", () => {
    const { container } = render(<MosaicUserButton clerkUserButton={MockUserButton} />);
    expect(container.querySelector('[data-slot="user-button"]')).toBeTruthy();
  });

  it("has displayName set", () => {
    expect(MosaicUserButton.displayName).toBe("MosaicUserButton");
  });

  it("accepts custom className on wrapper", () => {
    const { container } = render(
      <MosaicUserButton clerkUserButton={MockUserButton} className="my-ub-cls" />,
    );
    const root = container.querySelector('[data-slot="user-button"]');
    expect(root?.className).toContain("my-ub-cls");
  });

  it("mocks Clerk — no real ClerkProvider needed", () => {
    const mockFn = vi.fn(() => <div data-testid="mock-ub">UB</div>);
    render(<MosaicUserButton clerkUserButton={mockFn} />);
    expect(screen.getByTestId("mock-ub")).toBeTruthy();
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
