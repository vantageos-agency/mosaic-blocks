import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicSignUpLayout } from "./MosaicSignUpLayout.js";

// ── Mock Clerk SignUp ──────────────────────────────────────────────────────────

function MockSignUp({
  appearance,
  signInUrl,
  fallbackRedirectUrl,
}: {
  appearance?: Record<string, unknown>;
  signInUrl?: string;
  fallbackRedirectUrl?: string;
}) {
  return (
    <div
      data-testid="clerk-sign-up"
      data-signin-url={signInUrl}
      data-redirect={fallbackRedirectUrl}
      data-has-appearance={appearance ? "true" : "false"}
    >
      Sign Up Widget
    </div>
  );
}

describe("MosaicSignUpLayout", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    unmount();
  });

  it("renders the Clerk SignUp widget", () => {
    render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    expect(screen.getByTestId("clerk-sign-up")).toBeTruthy();
  });

  it("passes appearance prop to Clerk SignUp", () => {
    render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    const widget = screen.getByTestId("clerk-sign-up");
    expect(widget.getAttribute("data-has-appearance")).toBe("true");
  });

  it("passes signInUrl prop to Clerk SignUp", () => {
    render(<MosaicSignUpLayout clerkSignUp={MockSignUp} signInUrl="/login" />);
    const widget = screen.getByTestId("clerk-sign-up");
    expect(widget.getAttribute("data-signin-url")).toBe("/login");
  });

  it("renders headline and subheadline when provided", () => {
    render(
      <MosaicSignUpLayout
        clerkSignUp={MockSignUp}
        headline="Create your account"
        subheadline="Get started in seconds"
      />,
    );
    expect(screen.getByText("Create your account")).toBeTruthy();
    expect(screen.getByText("Get started in seconds")).toBeTruthy();
  });

  it("renders data-slot attribute on root element", () => {
    const { container } = render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    expect(container.querySelector('[data-slot="sign-up-layout"]')).toBeTruthy();
  });

  it("uses semantic Tailwind classes — bg-background on root", () => {
    const { container } = render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    const root = container.querySelector('[data-slot="sign-up-layout"]');
    expect(root?.className).toContain("bg-background");
  });

  it("does not render headline section when omitted", () => {
    render(<MosaicSignUpLayout clerkSignUp={MockSignUp} />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("passes afterSignUpUrl as fallbackRedirectUrl", () => {
    render(<MosaicSignUpLayout clerkSignUp={MockSignUp} afterSignUpUrl="/onboarding" />);
    const widget = screen.getByTestId("clerk-sign-up");
    expect(widget.getAttribute("data-redirect")).toBe("/onboarding");
  });

  it("has displayName set", () => {
    expect(MosaicSignUpLayout.displayName).toBe("MosaicSignUpLayout");
  });

  it("mocks Clerk — no real ClerkProvider needed", () => {
    const mockFn = vi.fn((props: { appearance?: Record<string, unknown> }) => (
      <div data-testid="clerk-fn-su">{JSON.stringify(!!props.appearance)}</div>
    ));
    render(<MosaicSignUpLayout clerkSignUp={mockFn} />);
    expect(screen.getByTestId("clerk-fn-su")).toBeTruthy();
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
