/**
 * MosaicChatMessage — tests
 *
 * Coverage: role-driven alignment (data-role + user/assistant bubble);
 * text parts rendered through the required `renderText` prop; reasoning
 * parts collapsed/expanded via the required reasoningLabel/
 * reasoningStreamingLabel, forced open while streaming; the 5-state tool-call
 * union — each state's own branch-only prop (`renderApproval` on
 * "approval-requested", `output` on "output-available", `errorText` on
 * "output-error") is exercised directly (each render call below only
 * compiles because the branch-specific props match the part's `state`);
 * required toolStatusLabels surfaced per state; no network call is ever made
 * by the component itself (fully presentational).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicChatMessage } from "./MosaicChatMessage.js";

const TOOL_STATUS_LABELS = {
  running: "En cours",
  completed: "Terminé",
  denied: "Refusé",
  error: "Erreur",
};

const BASE_PROPS = {
  renderText: (text: string) => text,
  reasoningLabel: "Raisonnement",
  reasoningStreamingLabel: "Réflexion en cours…",
  toolStatusLabels: TOOL_STATUS_LABELS,
};

describe("MosaicChatMessage", () => {
  it("sets data-slot='chat-message' and data-role on the root", () => {
    const { container } = render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="user"
        parts={[{ type: "text", text: "Salut" }]}
      />,
    );
    const root = container.querySelector("[data-slot='chat-message']");
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-role")).toBe("user");
  });

  it("aligns a user message to the end", () => {
    const { container } = render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="user"
        parts={[{ type: "text", text: "Salut" }]}
      />,
    );
    const root = container.querySelector("[data-slot='chat-message']");
    expect(root?.className).toContain("justify-end");
  });

  it("aligns an assistant message to the start", () => {
    const { container } = render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="assistant"
        parts={[{ type: "text", text: "Bonjour" }]}
      />,
    );
    const root = container.querySelector("[data-slot='chat-message']");
    expect(root?.className).toContain("justify-start");
  });

  it("renders a text part through the required renderText prop", () => {
    const renderText = vi.fn((text: string) => `[${text}]`);
    render(
      <MosaicChatMessage
        {...BASE_PROPS}
        renderText={renderText}
        messageRole="assistant"
        parts={[{ type: "text", text: "Bonjour le monde" }]}
      />,
    );
    expect(renderText).toHaveBeenCalledWith("Bonjour le monde");
    expect(screen.getByText("[Bonjour le monde]")).toBeTruthy();
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="assistant"
        parts={[{ type: "text", text: "Bonjour" }]}
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='chat-message']");
    expect(root?.className).toContain("my-custom-class");
  });

  describe("reasoning part", () => {
    it("shows the non-streaming reasoningLabel and is collapsed by default", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[{ type: "reasoning", text: "J'analyse la question." }]}
        />,
      );
      expect(screen.getByText("Raisonnement")).toBeTruthy();
      expect(screen.queryByText("J'analyse la question.")).toBeNull();
    });

    it("expands the reasoning panel on trigger click, rendering its text via renderText", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[{ type: "reasoning", text: "J'analyse la question." }]}
        />,
      );
      fireEvent.click(screen.getByText("Raisonnement"));
      expect(screen.getByText("J'analyse la question.")).toBeTruthy();
    });

    it("shows the streaming reasoningStreamingLabel and is expanded by default while streaming", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[{ type: "reasoning", text: "En cours de réflexion…", isStreaming: true }]}
        />,
      );
      expect(screen.getByText("Réflexion en cours…")).toBeTruthy();
      expect(screen.getByText("En cours de réflexion…")).toBeTruthy();
    });
  });

  describe("tool call — input-streaming", () => {
    it("shows the toolName and the required running status label", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[
            {
              type: "tool",
              toolCallId: "call_1",
              toolName: "search_docs",
              state: "input-streaming",
            },
          ]}
        />,
      );
      expect(screen.getByText("search_docs")).toBeTruthy();
      expect(screen.getByText("En cours")).toBeTruthy();
    });
  });

  describe("tool call — approval-requested", () => {
    it("invokes the required renderApproval extension point with the tool part", () => {
      const renderApproval = vi.fn(() => <button type="button">Approuver</button>);
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[
            {
              type: "tool",
              toolCallId: "call_2",
              toolName: "delete_file",
              state: "approval-requested",
              renderApproval,
            },
          ]}
        />,
      );
      expect(renderApproval).toHaveBeenCalledTimes(1);
      expect(renderApproval).toHaveBeenCalledWith(
        expect.objectContaining({ toolCallId: "call_2" }),
      );
      expect(screen.getByText("Approuver")).toBeTruthy();
      expect(screen.getByText("En cours")).toBeTruthy();
    });
  });

  describe("tool call — output-available", () => {
    it("renders the required output payload", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[
            {
              type: "tool",
              toolCallId: "call_3",
              toolName: "search_docs",
              state: "output-available",
              output: { hits: 3 },
            },
          ]}
        />,
      );
      expect(screen.getByText("Terminé")).toBeTruthy();
      expect(screen.getByText(/"hits": 3/)).toBeTruthy();
    });
  });

  describe("tool call — output-denied", () => {
    it("shows the required denied status label", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[
            {
              type: "tool",
              toolCallId: "call_4",
              toolName: "delete_file",
              state: "output-denied",
            },
          ]}
        />,
      );
      expect(screen.getByText("Refusé")).toBeTruthy();
    });
  });

  describe("tool call — output-error", () => {
    it("renders the required errorText", () => {
      render(
        <MosaicChatMessage
          {...BASE_PROPS}
          messageRole="assistant"
          parts={[
            {
              type: "tool",
              toolCallId: "call_5",
              toolName: "search_docs",
              state: "output-error",
              errorText: "Connexion refusée",
            },
          ]}
        />,
      );
      expect(screen.getByText("Erreur")).toBeTruthy();
      expect(screen.getByText("Connexion refusée")).toBeTruthy();
    });
  });

  it("renders the optional input payload on any tool-call state when present", () => {
    render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="assistant"
        parts={[
          {
            type: "tool",
            toolCallId: "call_6",
            toolName: "search_docs",
            state: "input-streaming",
            input: { query: "vantageos" },
          },
        ]}
      />,
    );
    expect(screen.getByText(/"query": "vantageos"/)).toBeTruthy();
  });

  it("renders multiple ordered parts in a single message", () => {
    render(
      <MosaicChatMessage
        {...BASE_PROPS}
        messageRole="assistant"
        parts={[
          { type: "reasoning", text: "Je réfléchis." },
          { type: "text", text: "Voici la réponse." },
          {
            type: "tool",
            toolCallId: "call_7",
            toolName: "search_docs",
            state: "output-available",
            output: "ok",
          },
        ]}
      />,
    );
    expect(screen.getByText("Raisonnement")).toBeTruthy();
    expect(screen.getByText("Voici la réponse.")).toBeTruthy();
    expect(screen.getByText("search_docs")).toBeTruthy();
  });
});
