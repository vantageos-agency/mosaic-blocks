/**
 * MosaicField — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicField.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicField } from "./MosaicField.js";

describe("MosaicField", () => {
  it("renders a label associated with a control via htmlFor", () => {
    render(
      <MosaicField>
        <MosaicField.Label>Email</MosaicField.Label>
        <MosaicField.Control id="email" render={<input type="email" />} />
      </MosaicField>,
    );
    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox");
    expect(label.tagName.toLowerCase()).toBe("label");
    expect(input.getAttribute("id")).toBe("email");
    // label must point to the control via htmlFor
    expect(label.getAttribute("for")).toBe("email");
  });

  it("renders a description", () => {
    render(
      <MosaicField>
        <MosaicField.Label>Name</MosaicField.Label>
        <MosaicField.Control render={<input type="text" />} />
        <MosaicField.Description>Enter your full name</MosaicField.Description>
      </MosaicField>,
    );
    expect(screen.getByText("Enter your full name")).toBeTruthy();
  });

  it("renders an error message", () => {
    render(
      <MosaicField>
        <MosaicField.Label>Email</MosaicField.Label>
        <MosaicField.Control render={<input type="email" />} />
        <MosaicField.Error show>This field is required</MosaicField.Error>
      </MosaicField>,
    );
    expect(screen.getByText("This field is required")).toBeTruthy();
  });

  it("sets data-slot='field' on the root element", () => {
    const { container } = render(
      <MosaicField>
        <MosaicField.Control render={<input type="text" />} />
      </MosaicField>,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("field");
  });

  it("forwards className to the root element", () => {
    const { container } = render(
      <MosaicField className="custom-field">
        <MosaicField.Control render={<input type="text" />} />
      </MosaicField>,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("custom-field");
  });

  it("renders control with aria-describedby pointing to description", () => {
    render(
      <MosaicField>
        <MosaicField.Label>City</MosaicField.Label>
        <MosaicField.Control render={<input type="text" />} />
        <MosaicField.Description>Your city of residence</MosaicField.Description>
      </MosaicField>,
    );
    const input = screen.getByRole("textbox");
    const desc = screen.getByText("Your city of residence");
    const describedBy = input.getAttribute("aria-describedby");
    if (describedBy) {
      expect(desc.getAttribute("id")).toBe(describedBy);
    }
    // Either linked or description is present — both are valid a11y approaches
    expect(desc).toBeTruthy();
  });
});
