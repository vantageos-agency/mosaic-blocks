import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MosaicTabs, MosaicTabsList, MosaicTabsPanel, MosaicTabsTrigger } from "./MosaicTabs.js";

function TestTabs() {
  return (
    <MosaicTabs defaultValue="overview">
      <MosaicTabsList>
        <MosaicTabsTrigger value="overview">Overview</MosaicTabsTrigger>
        <MosaicTabsTrigger value="details">Details</MosaicTabsTrigger>
      </MosaicTabsList>
      <MosaicTabsPanel value="overview">Overview content</MosaicTabsPanel>
      <MosaicTabsPanel value="details">Details content</MosaicTabsPanel>
    </MosaicTabs>
  );
}

describe("MosaicTabs", () => {
  it("renders tablist and tabs", () => {
    render(<TestTabs />);
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("shows the default panel content", () => {
    render(<TestTabs />);
    expect(screen.getByText("Overview content")).toBeTruthy();
  });

  it("switches panel on trigger click", async () => {
    const user = userEvent.setup();
    render(<TestTabs />);
    await user.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Details content")).toBeTruthy();
  });

  it("sets data-slot='tabs' on root", () => {
    render(<TestTabs />);
    expect(document.querySelector("[data-slot='tabs']")).toBeTruthy();
  });
});
