import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicMarketplaceCard } from "./MosaicMarketplaceCard.js";

describe("MosaicMarketplaceCard", () => {
  it("renders the agent name", () => {
    render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.getByText("Vantage Researcher")).toBeTruthy();
  });

  it("renders the description when provided", () => {
    render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        description="Deep research agent for market analysis"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.getByText("Deep research agent for market analysis")).toBeTruthy();
  });

  it("does not render a description node when absent", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(container.querySelector('[data-slot="marketplace-card-description"]')).toBeNull();
  });

  it("calls onAdopt with id when adopt button clicked", async () => {
    const onAdopt = vi.fn();
    render(
      <MosaicMarketplaceCard
        id="agent-42"
        name="Vantage Researcher"
        onAdopt={onAdopt}
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    const adoptBtn = screen.getByRole("button", { name: "Adopt" });
    await userEvent.click(adoptBtn);
    expect(onAdopt).toHaveBeenCalledWith("agent-42");
  });

  it("shows unadopt button and calls onUnadopt when isAdopted", async () => {
    const onUnadopt = vi.fn();
    render(
      <MosaicMarketplaceCard
        id="agent-42"
        name="Vantage Researcher"
        isAdopted
        onUnadopt={onUnadopt}
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.queryByRole("button", { name: "Adopt" })).toBeNull();
    const unadoptBtn = screen.getByRole("button", { name: "Remove" });
    await userEvent.click(unadoptBtn);
    expect(onUnadopt).toHaveBeenCalledWith("agent-42");
  });

  it("renders a real button element for the preview action, never a nested button", async () => {
    const onPreview = vi.fn();
    render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        onPreview={onPreview}
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    const previewBtn = screen.getByRole("button", { name: "Preview" });
    expect(previewBtn.tagName).toBe("BUTTON");
    expect(previewBtn.closest("button") === previewBtn).toBeTruthy();
    await userEvent.click(previewBtn);
    expect(onPreview).toHaveBeenCalledWith("agent-1");
  });

  it("does not render the preview button when onPreview is not provided", () => {
    render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
  });

  it("renders only host-provided mentions, never an invented badge", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        mentions={["Verified", "New"]}
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="badge"]').length).toBe(2);
  });

  it("renders no badge at all when mentions is absent", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(container.querySelectorAll('[data-slot="badge"]').length).toBe(0);
  });

  it("renders the host-provided rating value and ratingLabel, with no computed judgement text", () => {
    render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        rating={4.8}
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText("out of 5")).toBeTruthy();
  });

  it("does not render rating markup when rating is absent", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(container.querySelector('[data-slot="marketplace-card-rating"]')).toBeNull();
  });

  it("carries data-slot=marketplace-card on the root", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(container.querySelector('[data-slot="marketplace-card"]')).toBeTruthy();
  });

  it("applies a custom className on the root", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        className="my-mcard"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    expect(container.querySelector(".my-mcard")).toBeTruthy();
  });

  it("applies the compact variant class when variant=compact", () => {
    const { container } = render(
      <MosaicMarketplaceCard
        id="agent-1"
        name="Vantage Researcher"
        variant="compact"
        adoptLabel="Adopt"
        unadoptLabel="Remove"
        previewLabel="Preview"
        ratingLabel="out of 5"
      />,
    );
    const root = container.querySelector('[data-slot="marketplace-card"]');
    expect(root?.className.includes("flex-row")).toBeTruthy();
  });
});
