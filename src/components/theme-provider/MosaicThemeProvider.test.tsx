import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicThemeProvider } from "./MosaicThemeProvider.js";

describe("MosaicThemeProvider", () => {
  it("renders children without crashing (no provider)", () => {
    render(
      <MosaicThemeProvider>
        <p>Content</p>
      </MosaicThemeProvider>,
    );
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("renders data-slot=theme-provider wrapper", () => {
    const { container } = render(
      <MosaicThemeProvider>
        <p>Child</p>
      </MosaicThemeProvider>,
    );
    expect(container.querySelector('[data-slot="theme-provider"]')).toBeTruthy();
  });

  it("wraps children with provider component when given", () => {
    function MockProvider({
      children,
      attribute,
    }: {
      children: React.ReactNode;
      attribute?: string;
    }) {
      return (
        <div data-testid="mock-provider" data-attribute={attribute}>
          {children}
        </div>
      );
    }

    render(
      <MosaicThemeProvider provider={MockProvider} attribute="class">
        <p>Themed content</p>
      </MosaicThemeProvider>,
    );
    expect(screen.getByTestId("mock-provider")).toBeTruthy();
    expect(screen.getByText("Themed content")).toBeTruthy();
  });

  it("passes through extra props to provider", () => {
    function MockProvider({
      children,
      defaultTheme,
    }: {
      children: React.ReactNode;
      defaultTheme?: string;
    }) {
      return (
        <div data-testid="p" data-theme={defaultTheme}>
          {children}
        </div>
      );
    }

    render(
      <MosaicThemeProvider provider={MockProvider} defaultTheme="dark">
        <span>dark content</span>
      </MosaicThemeProvider>,
    );
    expect(screen.getByTestId("p").getAttribute("data-theme")).toBe("dark");
  });

  it("has displayName set", () => {
    expect(MosaicThemeProvider.displayName).toBe("MosaicThemeProvider");
  });
});
