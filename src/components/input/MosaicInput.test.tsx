/**
 * MosaicInput — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicInput.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicInput } from "./MosaicInput.js";

describe("MosaicInput", () => {
  it("renders an input element with data-slot='input'", () => {
    render(<MosaicInput />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("data-slot")).toBe("input");
  });

  it("renders with placeholder text", () => {
    render(<MosaicInput placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeTruthy();
  });

  it("accepts controlled value and onChange", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<MosaicInput value="" onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "hello");
    expect(handleChange).toHaveBeenCalled();
  });

  it("forwards ref to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<MosaicInput ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("input");
  });

  it("accepts additional className", () => {
    render(<MosaicInput className="my-input" />);
    expect(screen.getByRole("textbox").className).toContain("my-input");
  });

  it("renders as disabled when disabled prop is set", () => {
    render(<MosaicInput disabled />);
    const input = screen.getByRole("textbox");
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it("passes type prop to the input", () => {
    render(<MosaicInput type="email" />);
    // email inputs are not role=textbox in some browsers, query by placeholder or direct
    const input = document.querySelector("input[type='email']");
    expect(input).toBeTruthy();
  });
});
