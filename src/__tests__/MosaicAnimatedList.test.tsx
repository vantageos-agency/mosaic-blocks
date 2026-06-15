/**
 * MosaicAnimatedList — RED-first tests
 * Contract: renders without crash; renders ALL children
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicAnimatedList } from "../components/animated-list/MosaicAnimatedList.js";

describe("MosaicAnimatedList", () => {
  it("renders without crashing", () => {
    const { unmount } = render(
      <MosaicAnimatedList>
        <li>Item 1</li>
      </MosaicAnimatedList>,
    );
    unmount();
  });

  it("renders all children", () => {
    render(
      <MosaicAnimatedList>
        <li>Alpha</li>
        <li>Beta</li>
        <li>Gamma</li>
      </MosaicAnimatedList>,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  it("accepts stagger prop", () => {
    const { container } = render(
      <MosaicAnimatedList stagger={100}>
        <li>One</li>
        <li>Two</li>
      </MosaicAnimatedList>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
