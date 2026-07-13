/**
 * MosaicAgentChat — presentational session harness: MVP-8, the last MVP
 * piece, wiring MosaicChatThread + MosaicChatMessage + MosaicChatComposer +
 * MosaicApprovalPrompt into one send/resume/respond harness.
 *
 * Presentational only: no network call, no SDK, no stored client. The
 * message thread is NEVER accumulated as local state — `messages` is a
 * required, host-controlled prop recomputed by the host from its own event
 * journal on every render (this is what lets the thread survive a page
 * reload or a server restart: nothing here owns durable state). The three
 * things this harness actually owns are ephemeral UI-only concerns:
 * - which approval requests have already been answered IN THIS MOUNT
 *   (`decisions` — cleared implicitly once the host's `messages` replaces
 *   the underlying tool part with a real `output-available` / `output-denied`
 *   / `output-error` state);
 * - a one-shot guard so `onResumeSession` fires exactly once per `sessionId`
 *   value, never once per render;
 * - forwarding the composer's controlled `value`.
 *
 * Three extension seams, matching the eve/react send-turn contract:
 * - `onSubmit(text)` — send a new turn (idle branch of the composer state).
 * - `onResumeSession(sessionId)` — fired once when a host passes a
 *   `sessionId` prop, standing in for `agent.resume(sessionId)`.
 * - `onApprovalResponse({ requestId, optionId?, text? })` — the payload
 *   shape mirrors `SendTurnPayload.inputResponses` exactly (eve/react
 *   `client/types.ts`); this is the wire that lets an approval decision made
 *   in `MosaicApprovalPrompt` travel back to the agent runtime.
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module, host-controlled discriminated
 * union). Composes MosaicChatThread (MVP-1), MosaicChatMessage (MVP-2),
 * MosaicApprovalPrompt (MVP-3), and MosaicChatComposer (T10) — none of
 * these are reimplemented here.
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --card (root only — the composed children carry
 * their own tokens).
 * a11y: delegated entirely to the composed children (MosaicChatThread's
 * `role="log"`, MosaicChatComposer's labelled textarea/button,
 * MosaicApprovalPrompt's `fieldset`/`legend`) — this harness adds no new
 * interactive surface of its own beyond wiring props through.
 * Bilingual: every user-facing string this component reads directly
 * (`scrollToBottomLabel`, `textareaAriaLabel`, `placeholder`,
 * `sendButtonAriaLabel`/`stopButtonAriaLabel`, `reasoningLabel`,
 * `reasoningStreamingLabel`, `toolStatusLabels`, and every
 * `MosaicAgentChatApprovalLabels` field) is a required caller-supplied
 * prop — zero hardcoded copy, zero default.
 *
 * Props are pushed into the `MosaicAgentChatState` discriminated union
 * exactly where they are read: `onSubmit`/`sendButtonAriaLabel` only exist
 * on the "idle" branch (forwarded to the composer's own "idle" branch);
 * `onStop`/`stopButtonAriaLabel` only exist on the "responding" branch.
 * Likewise `MosaicAgentChatToolPartState`'s `approval` field is required
 * ONLY on the `"approval-requested"` member, mirroring
 * `MosaicChatMessageToolState`'s own per-branch contract.
 *
 * Ported from eve-tpl app/_components/agent-chat.tsx (rewritten from
 * scratch — no shared code, no license carried over): kept the
 * `agent.send({ inputResponses })` payload shape
 * (`{ requestId; optionId?; text? }`, client/types.ts:140-143) and the
 * "send a turn" / "respond to a pending input request" duality, dropped
 * every app-specific concern (sign-in gating, rate limiting, Convex
 * persistence, connection authorization, pending-message optimistic UI) —
 * all out of scope for a presentational harness.
 *
 * @example
 * // idle — can submit a new turn, resuming session "sess_42"
 * <MosaicAgentChat
 *   status="idle"
 *   messages={messagesFromEventLog}
 *   sessionId="sess_42"
 *   onResumeSession={(id) => resumeAgentSession(id)}
 *   onSubmit={(text) => sendTurn(text)}
 *   sendButtonAriaLabel="Envoyer le message"
 *   composerValue={draft}
 *   onComposerValueChange={setDraft}
 *   textareaAriaLabel="Message à eve"
 *   placeholder="Demandez ce que vous voulez à eve..."
 *   scrollToBottomLabel="Revenir au dernier message"
 *   reasoningLabel="Raisonnement"
 *   reasoningStreamingLabel="Réflexion en cours…"
 *   toolStatusLabels={{ running: "En cours", completed: "Terminé", denied: "Refusé", error: "Erreur" }}
 *   renderText={(text) => text}
 *   onApprovalResponse={(payload) => agent.send({ inputResponses: [payload] })}
 * />
 */

import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  MosaicApprovalPrompt,
  type MosaicApprovalPromptProps,
} from "../approval-prompt/MosaicApprovalPrompt.js";
import { MosaicChatComposer } from "../chat-composer/MosaicChatComposer.js";
import {
  MosaicChatMessage,
  type MosaicChatMessagePart,
  type MosaicChatMessageSenderRole,
  type MosaicChatMessageToolStatusLabels,
} from "../chat-message/MosaicChatMessage.js";
import { MosaicChatThread } from "../chat-thread/MosaicChatThread.js";
import { agentChatRootVariants } from "./agent-chat-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function formatPayload(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** The exact payload sent back to the agent runtime for one approval decision. */
export interface MosaicAgentChatApprovalResponsePayload {
  /** Identifies which pending input request this response answers. */
  requestId: string;
  /** Which choice was made — mirrors eve/react's `optionId` field. */
  optionId?: string;
  /** Free-text response, when the pending request expects one. */
  text?: string;
}

/** Host-owned copy for one approval request. Required, no default. */
export interface MosaicAgentChatApprovalLabels {
  promptTitle: string;
  toolNameLabel: string;
  approveButtonLabel: string;
  denyButtonLabel: string;
  approvedMessage: string;
  deniedMessage: string;
}

/**
 * Everything needed to render + resolve a pending approval, decoupled from
 * the tool part's own `toolCallId` (a request can outlive a specific tool
 * call id in some agent runtimes, so the two are kept distinct on the wire).
 */
export interface MosaicAgentChatApprovalRequest {
  /** Sent back as `requestId` in `MosaicAgentChatApprovalResponsePayload`. */
  requestId: string;
  /** `optionId` sent back when the host approves. */
  approveOptionId: string;
  /** `optionId` sent back when the host denies. */
  denyOptionId: string;
  approvalLabels: MosaicAgentChatApprovalLabels;
}

type MosaicAgentChatToolPartBase = {
  type: "tool";
  /** Stable identifier for this tool call, used as the React key. */
  toolCallId: string;
  /** Tool name, displayed as-is. */
  toolName: string;
  /** Tool call input payload, shown (JSON-stringified) when present. */
  input?: unknown;
};

/**
 * Tool-call lifecycle, mirroring `MosaicChatMessageToolState` — each
 * member's own required field lives on that member alone. `approval` is
 * required EXACTLY on `"approval-requested"`, the only branch that needs to
 * build a `MosaicApprovalPrompt` and respond on the wire.
 */
export type MosaicAgentChatToolPartState =
  | { state: "input-streaming" }
  | {
      state: "approval-requested";
      /** Everything needed to render + resolve this pending approval. */
      approval: MosaicAgentChatApprovalRequest;
    }
  | { state: "output-available"; output: unknown }
  | { state: "output-denied" }
  | { state: "output-error"; errorText: string };

export type MosaicAgentChatToolPart = MosaicAgentChatToolPartBase & MosaicAgentChatToolPartState;

export type MosaicAgentChatMessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string; isStreaming?: boolean }
  | MosaicAgentChatToolPart;

/** One message in the thread, recomputed by the host from its event journal. */
export interface MosaicAgentChatMessage {
  /** Stable identifier, used as the React key. */
  id: string;
  messageRole: MosaicChatMessageSenderRole;
  parts: MosaicAgentChatMessagePart[];
}

/**
 * Base props required in EVERY status — read unconditionally by the
 * component regardless of `status`.
 */
type MosaicAgentChatBaseProps = {
  /** The full thread, recomputed by the host from its own event journal. */
  messages: MosaicAgentChatMessage[];
  /** Renders a text/reasoning part's raw string (e.g. MosaicMarkdown). */
  renderText: (text: string) => React.ReactNode;
  reasoningLabel: string;
  reasoningStreamingLabel: string;
  toolStatusLabels: MosaicChatMessageToolStatusLabels;
  /** Accessible name for the thread's "scroll to bottom" button. */
  scrollToBottomLabel: string;
  /** Host-controlled current composer text. */
  composerValue: string;
  onComposerValueChange: (value: string) => void;
  textareaAriaLabel: string;
  placeholder: string;
  /**
   * Sends one approval decision back to the agent runtime. Mirrors
   * `agent.send({ inputResponses: [payload] })` — this harness never calls
   * a transport itself, it only builds and forwards the payload.
   */
  onApprovalResponse: (payload: MosaicAgentChatApprovalResponsePayload) => void;
  /**
   * When set, this harness is resuming an existing session rather than
   * starting a new one — `onResumeSession` fires exactly once per distinct
   * `sessionId` value, standing in for `agent.resume(sessionId)`.
   */
  sessionId?: string;
  onResumeSession?: (sessionId: string) => void;
  /** Disables the composer (e.g. host-level connectivity loss). */
  disabled?: boolean;
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * Host-controlled turn status, forwarded to `MosaicChatComposer`'s own
 * status union. `onSubmit`/`sendButtonAriaLabel` only exist on "idle";
 * `onStop`/`stopButtonAriaLabel` only exist on "responding".
 */
export type MosaicAgentChatState =
  | {
      status: "idle";
      /** Sends a new turn — the trimmed composer text. */
      onSubmit: (text: string) => void;
      sendButtonAriaLabel: string;
    }
  | {
      status: "responding";
      /** Cancels the in-flight agent response. */
      onStop: () => void;
      stopButtonAriaLabel: string;
    };

export type MosaicAgentChatProps = MosaicAgentChatBaseProps & MosaicAgentChatState;

// ── Approval wiring ───────────────────────────────────────────────────────────

type ApprovalDecisions = Record<string, "approved" | "denied">;

function renderApprovalPrompt(
  part: MosaicAgentChatToolPart & { state: "approval-requested" },
  decisions: ApprovalDecisions,
  onDecide: (
    payload: MosaicAgentChatApprovalResponsePayload,
    decision: "approved" | "denied",
  ) => void,
): React.ReactNode {
  const { approval } = part;
  const decision = decisions[approval.requestId];
  const renderArguments = (
    <pre
      data-slot="agent-chat-approval-arguments"
      className="max-h-56 overflow-auto rounded bg-muted/30 p-2 font-mono text-[11px] leading-5 text-muted-foreground"
    >
      {formatPayload(part.input)}
    </pre>
  );

  const sharedProps = {
    toolName: part.toolName,
    toolNameLabel: approval.approvalLabels.toolNameLabel,
    promptTitle: approval.approvalLabels.promptTitle,
    renderArguments,
  };

  if (decision === "approved" || decision === "denied") {
    const decisionMessage =
      decision === "approved"
        ? approval.approvalLabels.approvedMessage
        : approval.approvalLabels.deniedMessage;
    const respondedProps: MosaicApprovalPromptProps = {
      ...sharedProps,
      status: "responded",
      decision,
      decisionMessage,
    };
    return <MosaicApprovalPrompt {...respondedProps} />;
  }

  const pendingProps: MosaicApprovalPromptProps = {
    ...sharedProps,
    status: "pending",
    approveButtonLabel: approval.approvalLabels.approveButtonLabel,
    denyButtonLabel: approval.approvalLabels.denyButtonLabel,
    onApprove: () =>
      onDecide({ requestId: approval.requestId, optionId: approval.approveOptionId }, "approved"),
    onDeny: () =>
      onDecide({ requestId: approval.requestId, optionId: approval.denyOptionId }, "denied"),
  };
  return <MosaicApprovalPrompt {...pendingProps} />;
}

function toRenderPart(
  part: MosaicAgentChatMessagePart,
  decisions: ApprovalDecisions,
  onDecide: (
    payload: MosaicAgentChatApprovalResponsePayload,
    decision: "approved" | "denied",
  ) => void,
): MosaicChatMessagePart {
  if (part.type !== "tool") {
    return part;
  }

  if (part.state === "approval-requested") {
    return {
      type: "tool",
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      input: part.input,
      state: "approval-requested",
      renderApproval: () => renderApprovalPrompt(part, decisions, onDecide),
    };
  }

  switch (part.state) {
    case "input-streaming":
      return {
        type: "tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
        state: "input-streaming",
      };
    case "output-available":
      return {
        type: "tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
        state: "output-available",
        output: part.output,
      };
    case "output-denied":
      return {
        type: "tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
        state: "output-denied",
      };
    case "output-error":
      return {
        type: "tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
        state: "output-error",
        errorText: part.errorText,
      };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAgentChat — production session-harness atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: composes MosaicChatThread + MosaicChatMessage +
 * MosaicApprovalPrompt + MosaicChatComposer, sends a turn, resumes a
 * session once, and forwards approval decisions on the exact
 * `{ requestId; optionId?; text? }` wire shape. No network call, no SDK,
 * no stored thread.
 */
export function MosaicAgentChat(props: MosaicAgentChatProps) {
  const {
    messages,
    renderText,
    reasoningLabel,
    reasoningStreamingLabel,
    toolStatusLabels,
    scrollToBottomLabel,
    composerValue,
    onComposerValueChange,
    textareaAriaLabel,
    placeholder,
    onApprovalResponse,
    sessionId,
    onResumeSession,
    disabled = false,
    className,
    ref,
  } = props;

  const [decisions, setDecisions] = useState<ApprovalDecisions>({});
  const resumedSessionIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!sessionId || !onResumeSession) {
      return;
    }
    if (resumedSessionIdRef.current === sessionId) {
      return;
    }
    resumedSessionIdRef.current = sessionId;
    onResumeSession(sessionId);
  }, [sessionId, onResumeSession]);

  function handleDecide(
    payload: MosaicAgentChatApprovalResponsePayload,
    decision: "approved" | "denied",
  ): void {
    setDecisions((previous) => ({ ...previous, [payload.requestId]: decision }));
    onApprovalResponse(payload);
  }

  return (
    <div ref={ref} data-slot="agent-chat" className={cn(agentChatRootVariants(), className)}>
      <MosaicChatThread scrollToBottomLabel={scrollToBottomLabel}>
        {messages.map((message) => (
          <MosaicChatMessage
            key={message.id}
            messageRole={message.messageRole}
            parts={message.parts.map((part) => toRenderPart(part, decisions, handleDecide))}
            renderText={renderText}
            reasoningLabel={reasoningLabel}
            reasoningStreamingLabel={reasoningStreamingLabel}
            toolStatusLabels={toolStatusLabels}
          />
        ))}
      </MosaicChatThread>

      {props.status === "responding" ? (
        <MosaicChatComposer
          status="responding"
          value={composerValue}
          onValueChange={onComposerValueChange}
          textareaAriaLabel={textareaAriaLabel}
          placeholder={placeholder}
          disabled={disabled}
          onStop={props.onStop}
          stopButtonAriaLabel={props.stopButtonAriaLabel}
        />
      ) : (
        <MosaicChatComposer
          status="idle"
          value={composerValue}
          onValueChange={onComposerValueChange}
          textareaAriaLabel={textareaAriaLabel}
          placeholder={placeholder}
          disabled={disabled}
          onSubmit={props.onSubmit}
          sendButtonAriaLabel={props.sendButtonAriaLabel}
        />
      )}
    </div>
  );
}

MosaicAgentChat.displayName = "MosaicAgentChat";
