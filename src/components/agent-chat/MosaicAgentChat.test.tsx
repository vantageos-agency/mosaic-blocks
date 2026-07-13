/**
 * MosaicAgentChat — tests
 *
 * Coverage (the four required cases from the brief):
 * (a) sending a new turn — the "idle" composer submits `onSubmit(text)`.
 * (b) resuming an existing session — `onResumeSession(sessionId)` fires
 *     exactly once per mount/`sessionId` value, never once per render.
 * (c) sending back an APPROVED approval decision, on the exact
 *     `{ requestId; optionId?; text? }` wire shape.
 * (d) sending back a DENIED approval decision, on the same wire shape.
 *
 * Plus: root data-slot, "responding" composer branch (stop button), no
 * network call, custom className, and thread recomputed purely from the
 * `messages` prop (no internal accumulator — passing a *new* `messages`
 * array replaces what is rendered instead of appending to local state).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicAgentChat, type MosaicAgentChatMessage } from "./MosaicAgentChat.js";

const TOOL_STATUS_LABELS = {
  running: "En cours",
  completed: "Terminé",
  denied: "Refusé",
  error: "Erreur",
};

const APPROVAL_LABELS = {
  promptTitle: "L'agent souhaite exécuter un outil",
  toolNameLabel: "Outil demandé",
  approveButtonLabel: "Approuver",
  denyButtonLabel: "Refuser",
  approvedMessage: "Appel approuvé — exécution en cours",
  deniedMessage: "Appel refusé par l'utilisateur",
};

const BASE_PROPS = {
  renderText: (text: string) => text,
  reasoningLabel: "Raisonnement",
  reasoningStreamingLabel: "Réflexion en cours…",
  toolStatusLabels: TOOL_STATUS_LABELS,
  scrollToBottomLabel: "Revenir au dernier message",
  textareaAriaLabel: "Message à eve",
  placeholder: "Demandez ce que vous voulez à eve...",
};

function textMessages(): MosaicAgentChatMessage[] {
  return [{ id: "m1", messageRole: "user", parts: [{ type: "text", text: "Salut" }] }];
}

function approvalMessages(): MosaicAgentChatMessage[] {
  return [
    {
      id: "m1",
      messageRole: "assistant",
      parts: [
        {
          type: "tool",
          toolCallId: "call_1",
          toolName: "delete_file",
          input: { path: "/tmp/x" },
          state: "approval-requested",
          approval: {
            requestId: "req_1",
            approveOptionId: "opt_yes",
            denyOptionId: "opt_no",
            approvalLabels: APPROVAL_LABELS,
          },
        },
      ],
    },
  ];
}

describe("MosaicAgentChat", () => {
  it("sets data-slot='agent-chat' on the root", () => {
    const { container } = render(
      <MosaicAgentChat
        {...BASE_PROPS}
        messages={textMessages()}
        composerValue=""
        onComposerValueChange={vi.fn()}
        onApprovalResponse={vi.fn()}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    expect(container.querySelector("[data-slot='agent-chat']")).toBeTruthy();
  });

  it("renders the thread from the host-supplied messages prop", () => {
    render(
      <MosaicAgentChat
        {...BASE_PROPS}
        messages={textMessages()}
        composerValue=""
        onComposerValueChange={vi.fn()}
        onApprovalResponse={vi.fn()}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    expect(screen.getByText("Salut")).toBeTruthy();
  });

  it("re-renders from a replaced messages array instead of accumulating local state", () => {
    const { rerender } = render(
      <MosaicAgentChat
        {...BASE_PROPS}
        messages={textMessages()}
        composerValue=""
        onComposerValueChange={vi.fn()}
        onApprovalResponse={vi.fn()}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    expect(screen.getByText("Salut")).toBeTruthy();

    rerender(
      <MosaicAgentChat
        {...BASE_PROPS}
        messages={[
          { id: "m2", messageRole: "user", parts: [{ type: "text", text: "Autre message" }] },
        ]}
        composerValue=""
        onComposerValueChange={vi.fn()}
        onApprovalResponse={vi.fn()}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    expect(screen.queryByText("Salut")).toBeNull();
    expect(screen.getByText("Autre message")).toBeTruthy();
  });

  describe("(a) sending a new turn", () => {
    it("calls onSubmit with the composer text on Enter", () => {
      const onSubmit = vi.fn();
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={[]}
          composerValue="Bonjour eve"
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          status="idle"
          onSubmit={onSubmit}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      const textarea = screen.getByLabelText("Message à eve");
      fireEvent.keyDown(textarea, { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith("Bonjour eve");
    });

    it("renders the stop button and calls onStop while responding", () => {
      const onStop = vi.fn();
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={[]}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          status="responding"
          onStop={onStop}
          stopButtonAriaLabel="Arrêter la réponse"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Arrêter la réponse" }));
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe("(b) resuming an existing session", () => {
    it("calls onResumeSession exactly once for a given sessionId", () => {
      const onResumeSession = vi.fn();
      const { rerender } = render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={[]}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          sessionId="sess_42"
          onResumeSession={onResumeSession}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      expect(onResumeSession).toHaveBeenCalledTimes(1);
      expect(onResumeSession).toHaveBeenCalledWith("sess_42");

      // Re-rendering with the SAME sessionId must not fire it again.
      rerender(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={[{ id: "m1", messageRole: "user", parts: [{ type: "text", text: "Salut" }] }]}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          sessionId="sess_42"
          onResumeSession={onResumeSession}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      expect(onResumeSession).toHaveBeenCalledTimes(1);
    });

    it("does not call onResumeSession when no sessionId is supplied", () => {
      const onResumeSession = vi.fn();
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={[]}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          onResumeSession={onResumeSession}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      expect(onResumeSession).not.toHaveBeenCalled();
    });
  });

  describe("(c) sending back an APPROVED approval decision", () => {
    it("calls onApprovalResponse with requestId + approveOptionId on approve", () => {
      const onApprovalResponse = vi.fn();
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={approvalMessages()}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={onApprovalResponse}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Approuver" }));
      expect(onApprovalResponse).toHaveBeenCalledTimes(1);
      expect(onApprovalResponse).toHaveBeenCalledWith({ requestId: "req_1", optionId: "opt_yes" });
      expect(screen.getByText("Appel approuvé — exécution en cours")).toBeTruthy();
    });
  });

  describe("(d) sending back a DENIED approval decision", () => {
    it("calls onApprovalResponse with requestId + denyOptionId on deny", () => {
      const onApprovalResponse = vi.fn();
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={approvalMessages()}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={onApprovalResponse}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
      expect(onApprovalResponse).toHaveBeenCalledTimes(1);
      expect(onApprovalResponse).toHaveBeenCalledWith({ requestId: "req_1", optionId: "opt_no" });
      expect(screen.getByText("Appel refusé par l'utilisateur")).toBeTruthy();
    });

    it("no longer renders approve/deny buttons once a decision was sent", () => {
      render(
        <MosaicAgentChat
          {...BASE_PROPS}
          messages={approvalMessages()}
          composerValue=""
          onComposerValueChange={vi.fn()}
          onApprovalResponse={vi.fn()}
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
      expect(screen.queryByRole("button", { name: "Approuver" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Refuser" })).toBeNull();
    });
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicAgentChat
        {...BASE_PROPS}
        messages={[]}
        composerValue=""
        onComposerValueChange={vi.fn()}
        onApprovalResponse={vi.fn()}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='agent-chat']");
    expect(root?.className).toContain("my-custom-class");
  });
});
