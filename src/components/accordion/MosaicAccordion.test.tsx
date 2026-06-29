import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  MosaicAccordion,
  MosaicAccordionItem,
  MosaicAccordionPanel,
  MosaicAccordionTrigger,
} from "./MosaicAccordion.js";

function TestAccordion() {
  return (
    <MosaicAccordion>
      <MosaicAccordionItem value="item-1">
        <Accordion.Header>
          <MosaicAccordionTrigger>Section 1</MosaicAccordionTrigger>
        </Accordion.Header>
        <MosaicAccordionPanel>Content 1</MosaicAccordionPanel>
      </MosaicAccordionItem>
      <MosaicAccordionItem value="item-2">
        <Accordion.Header>
          <MosaicAccordionTrigger>Section 2</MosaicAccordionTrigger>
        </Accordion.Header>
        <MosaicAccordionPanel>Content 2</MosaicAccordionPanel>
      </MosaicAccordionItem>
    </MosaicAccordion>
  );
}

describe("MosaicAccordion", () => {
  it("renders triggers as buttons", () => {
    render(<TestAccordion />);
    expect(screen.getByRole("button", { name: /section 1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /section 2/i })).toBeTruthy();
  });

  it("sets data-slot='accordion' on root", () => {
    render(<TestAccordion />);
    expect(document.querySelector("[data-slot='accordion']")).toBeTruthy();
  });

  it("expands panel on trigger click", async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);
    await user.click(screen.getByRole("button", { name: /section 1/i }));
    expect(screen.getByText("Content 1")).toBeTruthy();
  });
});
