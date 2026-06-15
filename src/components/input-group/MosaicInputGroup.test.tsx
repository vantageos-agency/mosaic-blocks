/**
 * MosaicInputGroup — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicInputGroup.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicInput } from "../input/MosaicInput.js";
import { MosaicInputGroup } from "./MosaicInputGroup.js";

describe("MosaicInputGroup", () => {
  it("renders a div with data-slot='input-group'", () => {
    render(
      <MosaicInputGroup data-testid="group">
        <MosaicInput />
      </MosaicInputGroup>,
    );
    const el = screen.getByTestId("group");
    expect(el.tagName.toLowerCase()).toBe("div");
    expect(el.getAttribute("data-slot")).toBe("input-group");
  });

  it("renders children (the input)", () => {
    render(
      <MosaicInputGroup data-testid="group">
        <MosaicInput placeholder="Search..." />
      </MosaicInputGroup>,
    );
    expect(screen.getByPlaceholderText("Search...")).toBeTruthy();
  });

  it("renders prefix when provided", () => {
    render(
      <MosaicInputGroup prefix={<span data-testid="prefix">@</span>}>
        <MosaicInput />
      </MosaicInputGroup>,
    );
    expect(screen.getByTestId("prefix")).toBeTruthy();
  });

  it("renders suffix when provided", () => {
    render(
      <MosaicInputGroup suffix={<span data-testid="suffix">.com</span>}>
        <MosaicInput />
      </MosaicInputGroup>,
    );
    expect(screen.getByTestId("suffix")).toBeTruthy();
  });

  it("renders both prefix and suffix", () => {
    render(
      <MosaicInputGroup
        prefix={<span data-testid="pre">$</span>}
        suffix={<span data-testid="suf">USD</span>}
      >
        <MosaicInput />
      </MosaicInputGroup>,
    );
    expect(screen.getByTestId("pre")).toBeTruthy();
    expect(screen.getByTestId("suf")).toBeTruthy();
  });

  it("accepts additional className", () => {
    render(
      <MosaicInputGroup className="custom-group" data-testid="group">
        <MosaicInput />
      </MosaicInputGroup>,
    );
    expect(screen.getByTestId("group").className).toContain("custom-group");
  });
});
