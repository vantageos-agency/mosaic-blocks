"use client";

/**
 * MosaicChatMessage — one chat message: role + ordered parts (text /
 * reasoning / tool call).
 *
 * Presentational only: no network call, no SDK, no markdown engine, no
 * approval UI. Three explicit extension points are exposed instead of
 * bundled dependencies:
 * - `renderText` — the host renders the text part's markdown (MVP-7
 *   `MosaicMarkdown`, built in parallel). The library never picks a
 *   markdown engine.
 * - `renderApproval` — required ONLY on the tool-call `"approval-requested"`
 *   branch. The host renders its own approval UI (MVP-3
 *   `MosaicApprovalPrompt`, built in parallel) — this library never depends
 *   on a component that does not exist yet in its own package.
 * - `toolStatusLabels` — every user-facing tool-status word is host-owned
 *   copy (SIN-01 i18n), no English fallback baked in.
 *
 * Tool-call lifecycle is a discriminated union on `state`, matching the
 * eve/react part contract exactly (input-streaming -> approval-requested ->
 * output-available | output-denied | output-error). Each state's own
 * required prop lives on that state's branch alone — `renderApproval` only
 * exists on `"approval-requested"`, `output` only on `"output-available"`,
 * `errorText` only on `"output-error"` (mirrors MosaicUrlScraper's
 * status-branch contract and the "no lying prop contract" guard).
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module, host-controlled discriminated
 * union). Reuses MosaicCollapsible (@base-ui/react) for the reasoning
 * disclosure instead of hand-rolled state.
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted, --muted-foreground, --border,
 * --destructive, --emerald (status), --ring, --card.
 * No icon library — plain text/glyphs only (matches MosaicUrlScraper's "no
 * lucide-react runtime dependency" convention).
 * a11y: the reasoning disclosure is a real button (MosaicCollapsibleTrigger,
 * aria-expanded managed by @base-ui/react); tool-call status is exposed as
 * visible text, not color alone.
 * Bilingual: every user-facing string (reasoningLabel/reasoningStreamingLabel
 * /toolStatusLabels.*) is a required caller-supplied prop — zero hardcoded
 * copy, zero default.
 *
 * Ported from eve/react's components/chat/message.tsx (rewritten from
 * scratch — no shared code, no license carried over): dropped the
 * streaming-text-reveal simulation, the input-request/free-text-response UI,
 * the tool-name/action heuristics (formatToolName/describeToolAction/
 * toolCategory/...), and the connection-search special-casing — all
 * app-specific business logic outside a presentational library's scope.
 * Kept the role + parts shape and the 5-state tool-call union.
 *
 * @example
 * // text + reasoning + a completed tool call
 * <MosaicChatMessage
 *   messageRole="assistant"
 *   parts={[
 *     { type: "reasoning", text: "Je vérifie la doc avant de répondre." },
 *     { type: "text", text: "Voici la réponse." },
 *     {
 *       type: "tool",
 *       toolCallId: "call_1",
 *       toolName: "search_docs",
 *       state: "output-available",
 *       output: { hits: 3 },
 *     },
 *   ]}
 *   renderText={(text) => text}
 *   reasoningLabel="Raisonnement"
 *   reasoningStreamingLabel="Réflexion en cours…"
 *   toolStatusLabels={{
 *     running: "En cours",
 *     completed: "Terminé",
 *     denied: "Refusé",
 *     error: "Erreur",
 *   }}
 * />
 *
 * @example
 * // a tool call awaiting host-rendered approval
 * <MosaicChatMessage
 *   {...baseProps}
 *   parts={[
 *     {
 *       type: "tool",
 *       toolCallId: "call_2",
 *       toolName: "delete_file",
 *       state: "approval-requested",
 *       renderApproval: (part) => <MosaicApprovalPrompt toolName={part.toolName} />,
 *     },
 *   ]}
 * />
 */

import type * as React from "react";
import {
  MosaicCollapsible,
  MosaicCollapsiblePanel,
  MosaicCollapsibleTrigger,
} from "../collapsible/MosaicCollapsible.js";
import {
  chatMessageBubbleVariants,
  chatMessageContainerVariants,
  chatMessageToolStatusVariants,
} from "./chat-message-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicChatMessageSenderRole = "user" | "assistant";

/** Plain assistant/user text part. */
export interface MosaicChatMessageTextPart {
  type: "text";
  /** Raw text content — rendered through the host-supplied `renderText`. */
  text: string;
}

/** Repliable reasoning ("thinking") part. */
export interface MosaicChatMessageReasoningPart {
  type: "reasoning";
  /** Raw reasoning text — rendered through the host-supplied `renderText`. */
  text: string;
  /** Whether the reasoning is still streaming (forces the disclosure open). */
  isStreaming?: boolean;
}

/** Fields shared by every tool-call lifecycle state, read unconditionally. */
type MosaicChatMessageToolPartBase = {
  type: "tool";
  /** Stable identifier for this tool call, used as the React key. */
  toolCallId: string;
  /** Tool name, displayed as-is next to the status label. */
  toolName: string;
  /** Tool call input payload, shown (JSON-stringified) when present. */
  input?: unknown;
};

/**
 * Tool-call lifecycle, a discriminated union on `state`. Each member's
 * required field lives on that member ALONE — it is required exactly where
 * the component reads it:
 * - `"input-streaming"` / `"output-denied"`: no extra field, only the shared
 *   base + status label.
 * - `"approval-requested"`: `renderApproval` — the ONLY branch that needs a
 *   host-rendered extension point (MVP-3, not yet built).
 * - `"output-available"`: `output` — the tool's result payload.
 * - `"output-error"`: `errorText` — the host-localized error message.
 */
export type MosaicChatMessageToolState =
  | { state: "input-streaming" }
  | {
      state: "approval-requested";
      /**
       * Renders the host-owned approval UI (e.g. MVP-3
       * `MosaicApprovalPrompt`). Required on this branch only — the library
       * never imports a component that does not exist in its own package
       * yet, and never ships its own approval affordance.
       */
      renderApproval: (part: MosaicChatMessageToolPart) => React.ReactNode;
    }
  | {
      state: "output-available";
      /** The tool's result payload, JSON-stringified for display. */
      output: unknown;
    }
  | { state: "output-denied" }
  | {
      state: "output-error";
      /** Host-localized error message. Required, no default. */
      errorText: string;
    };

export type MosaicChatMessageToolPart = MosaicChatMessageToolPartBase & MosaicChatMessageToolState;

export type MosaicChatMessagePart =
  | MosaicChatMessageTextPart
  | MosaicChatMessageReasoningPart
  | MosaicChatMessageToolPart;

/** Host-owned copy for every tool-call status label. Required, no default. */
export interface MosaicChatMessageToolStatusLabels {
  running: string;
  completed: string;
  denied: string;
  error: string;
}

export interface MosaicChatMessageProps {
  /**
   * Who sent the message — drives bubble alignment/styling. Named
   * `messageRole` (not `role`) so no host ever writes a `role="user"` /
   * `role="assistant"` JSX attribute — `"user"`/`"assistant"` are not valid
   * WAI-ARIA roles, and a linter (or a screen reader) reading a literal
   * `role` attribute cannot tell a domain enum from a DOM ARIA role.
   * Exposed on the DOM as `data-role`, never as `role`.
   */
  messageRole: MosaicChatMessageSenderRole;
  /** Ordered message parts. */
  parts: MosaicChatMessagePart[];
  /**
   * Renders a text/reasoning part's raw string. The host owns the markdown
   * engine (MVP-7 `MosaicMarkdown`) — the library never bundles one.
   * Required, no default.
   */
  renderText: (text: string) => React.ReactNode;
  /** Label on the reasoning disclosure trigger while NOT streaming. Required, no default. */
  reasoningLabel: string;
  /** Label on the reasoning disclosure trigger WHILE streaming. Required, no default. */
  reasoningStreamingLabel: string;
  /** Host-owned copy for every tool-call status. Required, no default. */
  toolStatusLabels: MosaicChatMessageToolStatusLabels;
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLElement>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function partKey(part: MosaicChatMessagePart, index: number): string {
  return part.type === "tool" ? part.toolCallId : `${part.type}:${index}`;
}

function toolStatusOf(
  part: MosaicChatMessageToolPart,
): "running" | "completed" | "denied" | "error" {
  switch (part.state) {
    case "input-streaming":
    case "approval-requested":
      return "running";
    case "output-available":
      return "completed";
    case "output-denied":
      return "denied";
    case "output-error":
      return "error";
  }
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

// ── Sub-components ───────────────────────────────────────────────────────────

function ChatMessageTextPartView({
  part,
  renderText,
}: {
  part: MosaicChatMessageTextPart;
  renderText: (text: string) => React.ReactNode;
}) {
  return (
    <div data-slot="chat-message-text" className="whitespace-pre-wrap break-words">
      {renderText(part.text)}
    </div>
  );
}

function ChatMessageReasoningPartView({
  part,
  reasoningLabel,
  reasoningStreamingLabel,
  renderText,
}: {
  part: MosaicChatMessageReasoningPart;
  reasoningLabel: string;
  reasoningStreamingLabel: string;
  renderText: (text: string) => React.ReactNode;
}) {
  const isStreaming = Boolean(part.isStreaming);

  return (
    <MosaicCollapsible
      data-slot="chat-message-reasoning"
      defaultOpen={isStreaming}
      className="my-3 w-full"
    >
      <MosaicCollapsibleTrigger className="justify-start gap-2 text-sm text-muted-foreground">
        <span>{isStreaming ? reasoningStreamingLabel : reasoningLabel}</span>
      </MosaicCollapsibleTrigger>
      <MosaicCollapsiblePanel className="border-l border-border pl-4 text-muted-foreground">
        {renderText(part.text)}
      </MosaicCollapsiblePanel>
    </MosaicCollapsible>
  );
}

function ChatMessageToolPartView({
  part,
  toolStatusLabels,
}: {
  part: MosaicChatMessageToolPart;
  toolStatusLabels: MosaicChatMessageToolStatusLabels;
}) {
  const status = toolStatusOf(part);

  return (
    <div data-slot="chat-message-tool" className="my-2 flex flex-col gap-1 px-3">
      <div className="flex items-center gap-2">
        <span
          data-slot="chat-message-tool-name"
          className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
          {part.toolName}
        </span>
        <span
          data-slot="chat-message-tool-status"
          className={chatMessageToolStatusVariants({ status })}
        >
          {toolStatusLabels[status]}
        </span>
      </div>

      {part.input !== undefined && (
        <pre
          data-slot="chat-message-tool-input"
          className="max-h-56 overflow-auto rounded bg-muted/30 p-2 font-mono text-[11px] leading-5 text-muted-foreground"
        >
          {formatPayload(part.input)}
        </pre>
      )}

      {part.state === "approval-requested" && (
        <div data-slot="chat-message-tool-approval">{part.renderApproval(part)}</div>
      )}

      {part.state === "output-available" && (
        <pre
          data-slot="chat-message-tool-output"
          className="max-h-56 overflow-auto rounded bg-muted/30 p-2 font-mono text-[11px] leading-5 text-muted-foreground"
        >
          {formatPayload(part.output)}
        </pre>
      )}

      {part.state === "output-error" && (
        <p
          data-slot="chat-message-tool-error"
          className="rounded bg-destructive/10 p-2 font-mono text-[11px] leading-5 text-destructive"
        >
          {part.errorText}
        </p>
      )}
    </div>
  );
}

function ChatMessagePartView({
  part,
  renderText,
  reasoningLabel,
  reasoningStreamingLabel,
  toolStatusLabels,
}: {
  part: MosaicChatMessagePart;
  renderText: (text: string) => React.ReactNode;
  reasoningLabel: string;
  reasoningStreamingLabel: string;
  toolStatusLabels: MosaicChatMessageToolStatusLabels;
}) {
  switch (part.type) {
    case "text":
      return <ChatMessageTextPartView part={part} renderText={renderText} />;
    case "reasoning":
      return (
        <ChatMessageReasoningPartView
          part={part}
          reasoningLabel={reasoningLabel}
          reasoningStreamingLabel={reasoningStreamingLabel}
          renderText={renderText}
        />
      );
    case "tool":
      return <ChatMessageToolPartView part={part} toolStatusLabels={toolStatusLabels} />;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicChatMessage — production chat-message atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders one message's role-aligned bubble and its
 * ordered parts (text/reasoning/tool call). No network call, no markdown
 * engine, no approval UI — see the module JSDoc for the three extension
 * points.
 */
export function MosaicChatMessage({
  messageRole,
  parts,
  renderText,
  reasoningLabel,
  reasoningStreamingLabel,
  toolStatusLabels,
  className,
  ref,
}: MosaicChatMessageProps) {
  const isUser = messageRole === "user";

  return (
    <article
      ref={ref}
      data-slot="chat-message"
      data-role={messageRole}
      className={cn(chatMessageContainerVariants({ align: isUser ? "end" : "start" }), className)}
    >
      <div className={chatMessageBubbleVariants({ role: messageRole })}>
        {parts.map((part, index) => (
          <ChatMessagePartView
            key={partKey(part, index)}
            part={part}
            renderText={renderText}
            reasoningLabel={reasoningLabel}
            reasoningStreamingLabel={reasoningStreamingLabel}
            toolStatusLabels={toolStatusLabels}
          />
        ))}
      </div>
    </article>
  );
}

MosaicChatMessage.displayName = "MosaicChatMessage";
