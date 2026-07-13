/**
 * MosaicModelSelector — RED-first TDD
 *
 * Ported from any-debate-ai components/agent-composer/ModelSelector.tsx.
 * Built on @base-ui/react/combobox (native useFilter, keyboard nav, disabled items).
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicModelSelector.tsx exists)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicModelSelector } from "./MosaicModelSelector.js";

const MODELS = [
  { value: "gpt-5", label: "GPT-5", description: "Flagship reasoning model", meta: "128k tokens" },
  { value: "claude-opus", label: "Claude Opus", description: "Best for long-form writing" },
  { value: "legacy-model", label: "Legacy Model", disabled: true, description: "Deprecated" },
];

describe("MosaicModelSelector", () => {
  it("sets data-slot='model-selector' on the root", () => {
    const { container } = render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    expect(container.querySelector("[data-slot='model-selector']")).toBeTruthy();
  });

  it("renders trigger showing the placeholder when no value is selected", () => {
    render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    expect(input.getAttribute("placeholder")).toBe("Select a model");
  });

  it("renders trigger showing the selected model label", () => {
    render(
      <MosaicModelSelector
        models={MODELS}
        value="claude-opus"
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    expect(screen.getByText("Claude Opus")).toBeTruthy();
  });

  it("opens popup and lists models on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("GPT-5")).toBeTruthy();
    });
  });

  it("filters models by typed input", async () => {
    const user = userEvent.setup();
    render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Claude");
    await waitFor(() => {
      expect(screen.getByText("Claude Opus")).toBeTruthy();
      expect(screen.queryByText("GPT-5")).toBeFalsy();
    });
  });

  it("shows the host-provided empty message when no model matches", async () => {
    const user = userEvent.setup();
    render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "zzz-nonexistent");
    await waitFor(() => {
      expect(screen.getByText("No models found.")).toBeTruthy();
    });
  });

  it("navigates items with ArrowDown then selects with Enter", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <MosaicModelSelector
        models={MODELS}
        onValueChange={handler}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe("gpt-5");
  });

  it("closes popup on Escape", async () => {
    const user = userEvent.setup();
    render(
      <MosaicModelSelector
        models={MODELS}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await waitFor(() => expect(screen.getByText("GPT-5")).toBeTruthy());
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("GPT-5")).toBeFalsy();
    });
  });

  it("marks a disabled model with aria-disabled and never fires onValueChange for it", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <MosaicModelSelector
        models={MODELS}
        onValueChange={handler}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await waitFor(() => expect(screen.getByText("Legacy Model")).toBeTruthy());
    const disabledOption = screen.getByText("Legacy Model").closest("[role='option']");
    expect(disabledOption).toBeTruthy();
    expect(disabledOption?.getAttribute("aria-disabled")).toBe("true");
    await user.click(screen.getByText("Legacy Model"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("is controlled by the host: value + onValueChange drive selection", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const { rerender } = render(
      <MosaicModelSelector
        models={MODELS}
        value="gpt-5"
        onValueChange={handler}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    expect(screen.getByText("GPT-5")).toBeTruthy();
    const input = screen.getByRole("combobox");
    await user.click(input);
    await waitFor(() => expect(screen.getByText("Claude Opus")).toBeTruthy());
    await user.click(screen.getByText("Claude Opus"));
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe("claude-opus");
    // Component stays showing "gpt-5" until host re-renders with new value — proves control lives in the host.
    rerender(
      <MosaicModelSelector
        models={MODELS}
        value="claude-opus"
        onValueChange={handler}
        placeholder="Select a model"
        emptyMessage="No models found."
      />,
    );
    expect(screen.getByText("Claude Opus")).toBeTruthy();
  });
});
