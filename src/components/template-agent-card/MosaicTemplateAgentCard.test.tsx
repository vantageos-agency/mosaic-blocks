import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicTemplateAgentCard } from "./MosaicTemplateAgentCard.js";
import type { MosaicTemplateAgentData } from "./MosaicTemplateAgentCard.js";

const template: MosaicTemplateAgentData = {
  id: "tpl-1",
  name: "Product Debate Panel",
  description: "Three agents debate a product decision from different angles.",
  agentCount: 3,
  usageCount: 12,
  category: "product",
  tags: ["strategy", "roadmap", "risk", "extra-tag"],
};

const baseLabels = {
  selectAriaLabel: "Select the Product Debate Panel template",
  agentCountLabel: "3 agents",
  formatUsageCount: (count: number) => `${count} uses`,
  formatMoreTags: (count: number) => `+${count}`,
  previewAriaLabel: "Preview template",
  duplicateAriaLabel: "Duplicate template",
};

describe("MosaicTemplateAgentCard", () => {
  it("renders the template name", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("Product Debate Panel")).toBeTruthy();
  });

  it("renders the template description", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText(template.description)).toBeTruthy();
  });

  it("renders the agent count label", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("3 agents")).toBeTruthy();
  });

  it("renders the usage count via formatUsageCount (not the raw number)", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("12 uses")).toBeTruthy();
  });

  it("renders the category when present", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("product")).toBeTruthy();
  });

  it("renders only 3 tags plus an overflow badge via formatMoreTags", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("strategy")).toBeTruthy();
    expect(screen.getByText("roadmap")).toBeTruthy();
    expect(screen.getByText("risk")).toBeTruthy();
    expect(screen.queryByText("extra-tag")).toBeNull();
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("selects the template via a real <button>, not a div onClick, and is keyboard-actionable", async () => {
    const onSelect = vi.fn();
    render(<MosaicTemplateAgentCard template={template} onSelect={onSelect} {...baseLabels} />);
    const selectButton = screen.getByRole("button", {
      name: "Select the Product Debate Panel template",
    });
    expect(selectButton.tagName).toBe("BUTTON");
    selectButton.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(template);
  });

  it("does not render preview/duplicate actions when their handlers are absent", () => {
    render(<MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.queryByRole("button", { name: "Preview template" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Duplicate template" })).toBeNull();
  });

  it("calls onPreview with the template when the preview action is used", async () => {
    const onPreview = vi.fn();
    render(
      <MosaicTemplateAgentCard
        template={template}
        onSelect={vi.fn()}
        onPreview={onPreview}
        {...baseLabels}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Preview template" }));
    expect(onPreview).toHaveBeenCalledWith(template);
  });

  it("calls onDuplicate with the template when the duplicate action is used", async () => {
    const onDuplicate = vi.fn();
    render(
      <MosaicTemplateAgentCard
        template={template}
        onSelect={vi.fn()}
        onDuplicate={onDuplicate}
        {...baseLabels}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Duplicate template" }));
    expect(onDuplicate).toHaveBeenCalledWith(template);
  });

  it("marks the root with aria-pressed when isSelected is true", () => {
    render(
      <MosaicTemplateAgentCard template={template} onSelect={vi.fn()} isSelected {...baseLabels} />,
    );
    const selectButton = screen.getByRole("button", {
      name: "Select the Product Debate Panel template",
    });
    expect(selectButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders without a category, without tags, and without a usage count without crashing", () => {
    const minimal: MosaicTemplateAgentData = {
      id: "tpl-2",
      name: "Minimal Template",
      description: "No optional fields set.",
      agentCount: 1,
      usageCount: 0,
    };
    render(<MosaicTemplateAgentCard template={minimal} onSelect={vi.fn()} {...baseLabels} />);
    expect(screen.getByText("Minimal Template")).toBeTruthy();
    expect(screen.queryByText("product")).toBeNull();
  });

  it("sets data-slot='template-agent-card' on the root", () => {
    const { container } = render(
      <MosaicTemplateAgentCard template={template} onSelect={vi.fn()} {...baseLabels} />,
    );
    expect(container.querySelector("[data-slot='template-agent-card']")).toBeTruthy();
  });

  it("accepts a custom className", () => {
    const { container } = render(
      <MosaicTemplateAgentCard
        template={template}
        onSelect={vi.fn()}
        className="my-template-card"
        {...baseLabels}
      />,
    );
    expect(container.querySelector(".my-template-card")).toBeTruthy();
  });

  it("forwards a ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <MosaicTemplateAgentCard template={template} onSelect={vi.fn()} ref={ref} {...baseLabels} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
