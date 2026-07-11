import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicModuleCard } from "./MosaicModuleCard.js";

const sampleModule = {
  name: "Design Thinking",
  description: "Human-centered problem solving framework",
  details: "5 steps",
  icon: "💡",
  tags: ["innovation", "ux"],
};

describe("MosaicModuleCard", () => {
  it("renders module name", () => {
    render(
      <MosaicModuleCard
        type="framework"
        module={sampleModule}
        customBadgeLabel="CUSTOM"
        editAriaLabel="Edit module"
        removeAriaLabel="Remove module"
      />,
    );
    expect(screen.getByText("Design Thinking")).toBeTruthy();
  });

  it("renders module description", () => {
    render(
      <MosaicModuleCard
        type="framework"
        module={sampleModule}
        customBadgeLabel="CUSTOM"
        editAriaLabel="Edit module"
        removeAriaLabel="Remove module"
      />,
    );
    expect(screen.getByText("Human-centered problem solving framework")).toBeTruthy();
  });

  it("calls onRemove when remove button clicked", async () => {
    const onRemove = vi.fn();
    render(
      <MosaicModuleCard
        type="framework"
        module={sampleModule}
        onRemove={onRemove}
        customBadgeLabel="CUSTOM"
        editAriaLabel="Edit module"
        removeAriaLabel="Remove module"
      />,
    );
    const removeBtn = screen.getByRole("button", { name: /remove module/i });
    await userEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalled();
  });

  it("renders without remove/edit buttons when handlers not provided", () => {
    render(
      <MosaicModuleCard
        type="framework"
        module={sampleModule}
        customBadgeLabel="CUSTOM"
        editAriaLabel="Edit module"
        removeAriaLabel="Remove module"
      />,
    );
    expect(screen.queryByRole("button", { name: /remove module/i })).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MosaicModuleCard
        type="framework"
        module={sampleModule}
        className="my-module"
        customBadgeLabel="CUSTOM"
        editAriaLabel="Edit module"
        removeAriaLabel="Remove module"
      />,
    );
    expect(container.querySelector(".my-module")).toBeTruthy();
  });
});
