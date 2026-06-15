/**
 * MosaicFeatureCenteredMedia — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicFeatureCenteredMedia } from "./MosaicFeatureCenteredMedia.js";

afterEach(() => cleanup());

describe("MosaicFeatureCenteredMedia", () => {
  it("renders without crashing", () => {
    render(<MosaicFeatureCenteredMedia title="Feature title" body="Feature body" />);
  });

  it("renders the title", () => {
    render(<MosaicFeatureCenteredMedia title="Our features" body="Description here" />);
    expect(screen.getByText("Our features")).toBeDefined();
  });

  it("renders the body", () => {
    render(<MosaicFeatureCenteredMedia title="Our features" body="Description here" />);
    expect(screen.getByText("Description here")).toBeDefined();
  });

  it("renders media slot when provided", () => {
    render(
      <MosaicFeatureCenteredMedia
        title="Our features"
        body="Description here"
        media={<img src="/test.png" alt="feature media" />}
      />,
    );
    expect(screen.getByAltText("feature media")).toBeDefined();
  });
});
