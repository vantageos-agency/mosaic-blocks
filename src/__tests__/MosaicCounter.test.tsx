/**
 * MosaicCounter — RED-first tests
 * Contract: renders without crash + reaches target value after animation
 */

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicCounter } from "../components/counter/MosaicCounter.js";

// Stub requestAnimationFrame to run synchronously
const rafCallbacks: FrameRequestCallback[] = [];
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});
vi.stubGlobal("cancelAnimationFrame", () => {});

function flushRaf(times = 60) {
  for (let i = 0; i < times; i++) {
    const cbs = rafCallbacks.splice(0);
    for (const cb of cbs) cb(performance.now() + i * 16);
  }
}

describe("MosaicCounter", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicCounter value={100} />);
    unmount();
  });

  it("displays the target value after animation completes", () => {
    render(<MosaicCounter value={42} duration={500} />);
    act(() => {
      flushRaf(200);
    });
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("applies format function when provided", () => {
    render(
      <MosaicCounter value={1000} duration={100} format={(v: number) => `${v.toFixed(0)}+`} />,
    );
    act(() => {
      flushRaf(200);
    });
    expect(screen.getByText("1000+")).toBeTruthy();
  });
});
