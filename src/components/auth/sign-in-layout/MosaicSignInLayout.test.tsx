import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicSignInLayout } from "./MosaicSignInLayout.js";

// ── Mock Clerk SignIn ──────────────────────────────────────────────────────────

function MockSignIn({
  appearance,
  signUpUrl,
  signInUrl,
  fallbackRedirectUrl,
  forceRedirectUrl,
  routing,
  path,
}: {
  appearance?: Record<string, unknown>;
  signUpUrl?: string;
  signInUrl?: string;
  fallbackRedirectUrl?: string;
  forceRedirectUrl?: string;
  routing?: string;
  path?: string;
}) {
  return (
    <div
      data-testid="clerk-sign-in"
      data-signup-url={signUpUrl}
      data-signin-url={signInUrl}
      data-redirect={fallbackRedirectUrl}
      data-force-redirect={forceRedirectUrl}
      data-routing={routing}
      data-path={path}
      data-has-appearance={appearance ? "true" : "false"}
    >
      Sign In Widget
    </div>
  );
}

describe("MosaicSignInLayout", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    unmount();
  });

  it("renders the Clerk SignIn widget", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    expect(screen.getByTestId("clerk-sign-in")).toBeTruthy();
  });

  it("passes appearance prop to Clerk SignIn", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    const widget = screen.getByTestId("clerk-sign-in");
    expect(widget.getAttribute("data-has-appearance")).toBe("true");
  });

  it("passes signUpUrl prop to Clerk SignIn", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} signUpUrl="/register" />);
    const widget = screen.getByTestId("clerk-sign-in");
    expect(widget.getAttribute("data-signup-url")).toBe("/register");
  });

  it("renders headline and subheadline when provided", () => {
    render(
      <MosaicSignInLayout
        clerkSignIn={MockSignIn}
        headline="Welcome back"
        subheadline="Sign in to continue"
      />,
    );
    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(screen.getByText("Sign in to continue")).toBeTruthy();
  });

  it("renders data-slot attribute on root element", () => {
    const { container } = render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    expect(container.querySelector('[data-slot="sign-in-layout"]')).toBeTruthy();
  });

  it("uses semantic Tailwind classes — bg-background on root", () => {
    const { container } = render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    const root = container.querySelector('[data-slot="sign-in-layout"]');
    expect(root?.className).toContain("bg-background");
  });

  it("does not render headline section when neither headline nor subheadline is set", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("accepts and applies custom className", () => {
    const { container } = render(
      <MosaicSignInLayout clerkSignIn={MockSignIn} className="custom-cls" />,
    );
    const root = container.querySelector('[data-slot="sign-in-layout"]');
    expect(root?.className).toContain("custom-cls");
  });

  it("has displayName set", () => {
    expect(MosaicSignInLayout.displayName).toBe("MosaicSignInLayout");
  });

  it("passes afterSignInUrl as fallbackRedirectUrl", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} afterSignInUrl="/dashboard" />);
    const widget = screen.getByTestId("clerk-sign-in");
    expect(widget.getAttribute("data-redirect")).toBe("/dashboard");
  });

  it("mocks Clerk — no real ClerkProvider needed", () => {
    const mockFn = vi.fn((props: { appearance?: Record<string, unknown> }) => (
      <div data-testid="clerk-fn">{JSON.stringify(!!props.appearance)}</div>
    ));
    render(<MosaicSignInLayout clerkSignIn={mockFn} />);
    expect(screen.getByTestId("clerk-fn")).toBeTruthy();
    expect(mockFn).toHaveBeenCalledOnce();
  });

  // ── New props (gap #1) ───────────────────────────────────────────────────────

  it("passes routing prop to Clerk SignIn", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} routing="path" />);
    expect(screen.getByTestId("clerk-sign-in").getAttribute("data-routing")).toBe("path");
  });

  it("passes path prop to Clerk SignIn", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} routing="path" path="/sign-in" />);
    expect(screen.getByTestId("clerk-sign-in").getAttribute("data-path")).toBe("/sign-in");
  });

  it("passes forceRedirectUrl to Clerk SignIn", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} forceRedirectUrl="/onboarding" />);
    expect(screen.getByTestId("clerk-sign-in").getAttribute("data-force-redirect")).toBe(
      "/onboarding",
    );
  });

  it("does not forward routing attr when prop omitted", () => {
    render(<MosaicSignInLayout clerkSignIn={MockSignIn} />);
    expect(screen.getByTestId("clerk-sign-in").getAttribute("data-routing")).toBeNull();
  });
});
