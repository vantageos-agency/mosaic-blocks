/**
 * useMediaQuery — RED-first tests
 * Contract: returns boolean; SSR-safe (no window during render); responds to matchMedia change
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

// Mock matchMedia
type MockListener = (e: { matches: boolean }) => void;

let mockMatches = false;
const listeners: MockListener[] = [];

const mockMatchMedia = (_query: string) => ({
  matches: mockMatches,
  media: _query,
  onchange: null,
  addListener: (fn: MockListener) => listeners.push(fn),
  removeListener: (fn: MockListener) => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  },
  addEventListener: (event: string, fn: MockListener) => {
    if (event === "change") listeners.push(fn);
  },
  removeEventListener: (event: string, fn: MockListener) => {
    if (event === "change") {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    }
  },
  dispatchEvent: () => false,
});

beforeEach(() => {
  mockMatches = false;
  listeners.length = 0;
  vi.stubGlobal("matchMedia", mockMatchMedia);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
  it("returns a boolean", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(typeof result.current).toBe("boolean");
  });

  it("returns false when matchMedia does not match", () => {
    mockMatches = false;
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("returns true when matchMedia matches", () => {
    mockMatches = true;
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("updates when matchMedia fires a change event", () => {
    mockMatches = false;
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      mockMatches = true;
      for (const fn of listeners) fn({ matches: true });
    });

    expect(result.current).toBe(true);
  });
});
