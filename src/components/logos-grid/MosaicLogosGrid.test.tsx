/**
 * MosaicLogosGrid — RED-first tests (T3-A Batch A + T4 stagger variant)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MosaicLogosGrid } from "./MosaicLogosGrid.js";

// jsdom does not implement matchMedia — stub it so components that call it don't throw.
// Default stub: prefers-reduced-motion is NOT active.
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia;

beforeAll(() => {
  vi.stubGlobal("matchMedia", matchMediaMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => cleanup());

describe("MosaicLogosGrid", () => {
  const logos = [
    { name: "Notion", src: "/logos/notion.svg" },
    { name: "Framer", src: "/logos/framer.svg" },
    { name: "Slack", src: "/logos/slack.svg" },
  ];

  it("renders without crashing", () => {
    render(<MosaicLogosGrid logos={logos} />);
  });

  it("renders all logo alt texts", () => {
    render(<MosaicLogosGrid logos={logos} />);
    expect(screen.getByAltText("Notion")).toBeDefined();
    expect(screen.getByAltText("Framer")).toBeDefined();
    expect(screen.getByAltText("Slack")).toBeDefined();
  });

  it("renders heading when provided", () => {
    render(<MosaicLogosGrid logos={logos} heading="Our partners" />);
    expect(screen.getByText("Our partners")).toBeDefined();
  });

  // ── T4 stagger-motion tests ──────────────────────────────────────────────

  describe("stagger prop", () => {
    it("default (no stagger) sets no animation-delay on logo wrappers", () => {
      render(<MosaicLogosGrid logos={logos} />);
      const wrappers = document.querySelectorAll('[data-slot="logos-grid-item"]');
      for (const wrapper of wrappers) {
        const el = wrapper as HTMLElement;
        expect(el.style.animationDelay).toBe("");
      }
    });

    it("stagger=true sets increasing animation-delay on logo wrappers", () => {
      render(<MosaicLogosGrid logos={logos} stagger />);
      const wrappers = document.querySelectorAll('[data-slot="logos-grid-item"]');
      const delays = Array.from(wrappers).map((el) => (el as HTMLElement).style.animationDelay);
      // First item: 0ms, subsequent items: increasing by default 80ms step
      expect(delays[0]).toBe("0ms");
      expect(delays[1]).toBe("80ms");
      expect(delays[2]).toBe("160ms");
    });

    it("stagger=number uses that value as the ms step", () => {
      render(<MosaicLogosGrid logos={logos} stagger={120} />);
      const wrappers = document.querySelectorAll('[data-slot="logos-grid-item"]');
      const delays = Array.from(wrappers).map((el) => (el as HTMLElement).style.animationDelay);
      expect(delays[0]).toBe("0ms");
      expect(delays[1]).toBe("120ms");
      expect(delays[2]).toBe("240ms");
    });

    it("respects prefers-reduced-motion: does not set animation-delay", () => {
      // Override matchMedia to simulate prefers-reduced-motion: reduce
      vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })) as unknown as typeof window.matchMedia,
      );

      render(<MosaicLogosGrid logos={logos} stagger={80} />);
      const wrappers = document.querySelectorAll('[data-slot="logos-grid-item"]');
      for (const wrapper of wrappers) {
        const el = wrapper as HTMLElement;
        expect(el.style.animationDelay).toBe("");
      }

      // Restore default mock
      vi.stubGlobal("matchMedia", matchMediaMock);
    });
  });
});
