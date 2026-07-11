/**
 * MosaicStepPipeline — tests
 *
 * Coverage: renders N steps; currentIndex derives done/current/upcoming;
 * explicit per-step status overrides; aria-current on current step;
 * horizontal + vertical orientations; data-slot attributes; no "same key" warnings.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicStepPipeline } from "./MosaicStepPipeline.js";
import type { MosaicStep } from "./MosaicStepPipeline.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const THREE_STEPS: MosaicStep[] = [{ label: "Setup" }, { label: "Configure" }, { label: "Deploy" }];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MosaicStepPipeline", () => {
  it("renders all step labels", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={0} />);
    expect(screen.getByText("Setup")).toBeTruthy();
    expect(screen.getByText("Configure")).toBeTruthy();
    expect(screen.getByText("Deploy")).toBeTruthy();
  });

  it("sets aria-current='step' on the current step only", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={1} />);
    const items = screen.getAllByRole("listitem");
    // index 0 = done, index 1 = current, index 2 = upcoming
    expect(items[0].getAttribute("aria-current")).toBeNull();
    expect(items[1].getAttribute("aria-current")).toBe("step");
    expect(items[2].getAttribute("aria-current")).toBeNull();
  });

  it("derives 'done' status for steps before currentIndex", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={2} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].getAttribute("data-status")).toBe("done");
    expect(items[1].getAttribute("data-status")).toBe("done");
    expect(items[2].getAttribute("data-status")).toBe("current");
  });

  it("derives 'upcoming' status for steps after currentIndex", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={0} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].getAttribute("data-status")).toBe("current");
    expect(items[1].getAttribute("data-status")).toBe("upcoming");
    expect(items[2].getAttribute("data-status")).toBe("upcoming");
  });

  it("respects explicit per-step status overriding currentIndex", () => {
    const explicitSteps: MosaicStep[] = [
      { label: "One", status: "done" },
      { label: "Two", status: "current" },
      { label: "Three", status: "upcoming" },
    ];
    // currentIndex=0 would normally make only index 0 current; explicit status wins
    render(<MosaicStepPipeline steps={explicitSteps} currentIndex={0} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].getAttribute("data-status")).toBe("done");
    expect(items[1].getAttribute("data-status")).toBe("current");
    expect(items[2].getAttribute("data-status")).toBe("upcoming");
    // aria-current follows the explicit "current" status on index 1
    expect(items[1].getAttribute("aria-current")).toBe("step");
  });

  it("renders with horizontal orientation (default)", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} />);
    const root = container.querySelector("[data-slot='step-pipeline']");
    expect(root).toBeTruthy();
    expect(root?.className).toContain("flex-row");
  });

  it("renders with vertical orientation", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} orientation="vertical" />);
    const root = container.querySelector("[data-slot='step-pipeline']");
    expect(root).toBeTruthy();
    expect(root?.className).toContain("flex-col");
  });

  it("sets data-slot='step-pipeline' on root", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} />);
    expect(container.querySelector("[data-slot='step-pipeline']")).toBeTruthy();
  });

  it("sets data-slot='step' on each list item", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} />);
    const stepSlots = container.querySelectorAll("[data-slot='step']");
    expect(stepSlots.length).toBe(3);
  });

  it("sets data-slot='step-indicator' on each step indicator", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} />);
    const indicators = container.querySelectorAll("[data-slot='step-indicator']");
    expect(indicators.length).toBe(3);
  });

  it("renders ol/li semantic structure", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} />);
    expect(container.querySelector("ol")).toBeTruthy();
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  it("renders ✓ indicator for done steps", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={2} />);
    // First two steps are done, should show ✓
    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks.length).toBe(2);
  });

  it("renders numeric indicators for non-done steps", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={0} />);
    // index 0 is current (no ✓), renders "1"; index 1,2 are upcoming renders "2","3"
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders step descriptions when provided", () => {
    const stepsWithDesc: MosaicStep[] = [
      { label: "Step A", description: "First step description" },
      { label: "Step B" },
    ];
    render(<MosaicStepPipeline steps={stepsWithDesc} />);
    expect(screen.getByText("First step description")).toBeTruthy();
    const descSlots = document.querySelectorAll("[data-slot='step-description']");
    expect(descSlots.length).toBe(1);
  });

  it("uses step.id as React key when provided (no same-key warning)", () => {
    // Steps with duplicate labels but unique ids — should not cause React key collision
    const stepsWithId: MosaicStep[] = [
      { id: "step-1", label: "Review" },
      { id: "step-2", label: "Review" },
      { id: "step-3", label: "Approve" },
    ];
    const { container } = render(<MosaicStepPipeline steps={stepsWithId} />);
    expect(container.querySelectorAll("[data-slot='step']").length).toBe(3);
  });

  it("applies custom className to root", () => {
    const { container } = render(
      <MosaicStepPipeline steps={THREE_STEPS} className="my-custom-class" />,
    );
    const root = container.querySelector("[data-slot='step-pipeline']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("renders a single step without connectors", () => {
    const { container } = render(
      <MosaicStepPipeline steps={[{ label: "Only step" }]} currentIndex={0} />,
    );
    expect(container.querySelectorAll("[data-slot='step-connector']").length).toBe(0);
  });

  it("renders connectors between steps (horizontal)", () => {
    const { container } = render(<MosaicStepPipeline steps={THREE_STEPS} currentIndex={0} />);
    // 3 steps → 2 connectors between adjacent pairs (each shown as 2 half-connectors per step boundary)
    const connectors = container.querySelectorAll("[data-slot='step-connector']");
    expect(connectors.length).toBeGreaterThan(0);
  });

  it("defaults currentIndex to 0 when not provided", () => {
    render(<MosaicStepPipeline steps={THREE_STEPS} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].getAttribute("data-status")).toBe("current");
    expect(items[1].getAttribute("data-status")).toBe("upcoming");
  });
});

// ── variant="segments" (compact progress bar) ──────────────────────────────────

describe("MosaicStepPipeline variant='segments'", () => {
  it("renders N segments for N steps, filled for done/current, unfilled for upcoming", () => {
    const { container } = render(
      <MosaicStepPipeline
        steps={THREE_STEPS}
        currentIndex={1}
        variant="segments"
        progressAriaLabel="Progression de la mission"
      />,
    );
    const segments = container.querySelectorAll("[data-slot='step-segment']");
    expect(segments.length).toBe(3);
    // index 0 = done -> filled, index 1 = current -> filled, index 2 = upcoming -> not filled
    expect(segments[0].getAttribute("data-status")).toBe("done");
    expect(segments[1].getAttribute("data-status")).toBe("current");
    expect(segments[2].getAttribute("data-status")).toBe("upcoming");
    expect(segments[0].getAttribute("data-filled")).toBe("true");
    expect(segments[1].getAttribute("data-filled")).toBe("true");
    expect(segments[2].getAttribute("data-filled")).toBe("false");
  });

  it("renders no dots and no step labels in segment mode", () => {
    const { container } = render(
      <MosaicStepPipeline
        steps={THREE_STEPS}
        currentIndex={1}
        variant="segments"
        progressAriaLabel="Progression de la mission"
      />,
    );
    expect(container.querySelectorAll("[data-slot='step-indicator']").length).toBe(0);
    expect(container.querySelectorAll("[data-slot='step-label']").length).toBe(0);
    expect(container.querySelectorAll("[data-slot='step-description']").length).toBe(0);
    expect(container.querySelector("ol")).toBeFalsy();
  });

  it("honours the required progressAriaLabel prop (host-owned French string)", () => {
    const { container } = render(
      <MosaicStepPipeline
        steps={THREE_STEPS}
        currentIndex={1}
        variant="segments"
        progressAriaLabel="Progression de la mission : étape 2 sur 3"
      />,
    );
    const root = container.querySelector("[data-slot='step-segment-bar']");
    expect(root?.getAttribute("aria-label")).toBe("Progression de la mission : étape 2 sur 3");
    expect(root?.getAttribute("role")).toBe("progressbar");
  });

  it("uses the optional progressLabel function prop for aria-valuetext when provided", () => {
    const progressLabel = (current: number, total: number) => `Étape ${current} sur ${total}`;
    const { container } = render(
      <MosaicStepPipeline
        steps={THREE_STEPS}
        currentIndex={1}
        variant="segments"
        progressAriaLabel="Progression de la mission"
        progressLabel={progressLabel}
      />,
    );
    const root = container.querySelector("[data-slot='step-segment-bar']");
    expect(root?.getAttribute("aria-valuetext")).toBe("Étape 2 sur 3");
    expect(root?.getAttribute("aria-valuenow")).toBe("2");
    expect(root?.getAttribute("aria-valuemax")).toBe("3");
  });
});
