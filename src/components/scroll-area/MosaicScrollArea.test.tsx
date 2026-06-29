import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicScrollArea } from "./MosaicScrollArea.js";

describe("MosaicScrollArea", () => {
  it("renders children", () => {
    render(
      <MosaicScrollArea>
        <p>Scrollable content</p>
      </MosaicScrollArea>,
    );
    expect(screen.getByText("Scrollable content")).toBeTruthy();
  });

  it("sets data-slot='scroll-area' on root", () => {
    render(
      <MosaicScrollArea>
        <p>Content</p>
      </MosaicScrollArea>,
    );
    expect(document.querySelector("[data-slot='scroll-area']")).toBeTruthy();
  });

  it("renders a viewport element", () => {
    render(
      <MosaicScrollArea>
        <p>Content</p>
      </MosaicScrollArea>,
    );
    expect(document.querySelector("[data-slot='scroll-area-viewport']")).toBeTruthy();
  });
});
