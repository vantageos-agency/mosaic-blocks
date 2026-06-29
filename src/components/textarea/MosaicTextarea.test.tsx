import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MosaicTextarea } from "./MosaicTextarea.js";

describe("MosaicTextarea", () => {
  it("renders a textarea element", () => {
    render(<MosaicTextarea aria-label="Message" />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("sets data-slot='textarea' attribute", () => {
    render(<MosaicTextarea aria-label="Message" />);
    const el = screen.getByRole("textbox");
    expect(el.getAttribute("data-slot")).toBe("textarea");
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<MosaicTextarea aria-label="Message" />);
    const el = screen.getByRole("textbox");
    await user.type(el, "hello");
    expect((el as HTMLTextAreaElement).value).toBe("hello");
  });

  it("is disabled when disabled prop is set", () => {
    render(<MosaicTextarea aria-label="Message" disabled />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
  });
});
