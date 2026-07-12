/**
 * MosaicApprovalPrompt — presentational "reprendre la main" tool-call approval
 *
 * Presentational atom. Shows which tool the agent wants to call, the tool's
 * arguments (host-rendered — this library never decides how a JSON payload
 * looks), and two actions: approve / deny. The component performs no
 * network call and owns no SDK: submitting a decision is surfaced purely via
 * the `onApprove()` / `onDeny()` callbacks — the host owns how the decision
 * is actually sent to the agent runtime and what happens next.
 *
 * Autonomous: does NOT depend on any chat-message component (developed in
 * parallel elsewhere) — the host inserts this component wherever an
 * approval-requested tool part appears in its own message rendering.
 *
 * Arguments rendering is host-controlled by design: `renderArguments` is a
 * required `React.ReactNode`, never a built-in JSON pretty-printer. The
 * host decides syntax highlighting, truncation, diffing, or any other
 * representation of the tool payload.
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module, host-controlled status union as
 * a discriminated prop type).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted-foreground, --border, --destructive,
 * --ring, --accent, --card, --background.
 * a11y: the root is a native `<fieldset>` whose `<legend>` is the required
 * `promptTitle` (an approval is a consequential action, so the whole prompt
 * is announced as one unit via the standard fieldset/legend semantics);
 * approve/deny are native `<button>` elements whose accessible
 * name IS their required visible label — no separate aria-label needed for
 * them. The tool-name region and the arguments region are always rendered,
 * in every status, so the decision/error state never loses the "what was
 * this about" context.
 * Bilingual: every user-facing string (promptTitle/toolNameLabel/
 * approveButtonLabel/denyButtonLabel/decisionMessage/errorMessage) is a
 * required caller-supplied prop — zero hardcoded copy, zero default.
 *
 * Props are pushed into the `MosaicApprovalPromptState` discriminated union
 * exactly where they are read — `onApprove`/`onDeny`/`approveButtonLabel`/
 * `denyButtonLabel` only exist on the "pending" branch, `decision`/
 * `decisionMessage` only on "responded", `errorMessage` only on "error".
 *
 * @example
 * // pending
 * <MosaicApprovalPrompt
 *   status="pending"
 *   toolName="delete_file"
 *   toolNameLabel="Outil demandé"
 *   promptTitle="L'agent souhaite exécuter un outil"
 *   renderArguments={<ToolArgsViewer args={part.input} />}
 *   onApprove={() => respond("approved")}
 *   onDeny={() => respond("denied")}
 *   approveButtonLabel="Approuver"
 *   denyButtonLabel="Refuser"
 * />
 *
 * @example
 * // responded
 * <MosaicApprovalPrompt
 *   {...baseProps}
 *   status="responded"
 *   decision="approved"
 *   decisionMessage="Appel approuvé — exécution en cours"
 * />
 */

import type * as React from "react";
import {
  approvalPromptButtonVariants,
  approvalPromptCardVariants,
  approvalPromptMessageVariants,
} from "./approval-prompt-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Base props required in EVERY status — read unconditionally by the
 * component regardless of `status` (title + tool-name + host-rendered
 * arguments region are always shown, even after a decision or on error).
 */
type MosaicApprovalPromptBaseProps = {
  /** Name of the tool the agent wants to call, displayed as-is. */
  toolName: string;
  /** Label preceding `toolName` (e.g. "Requested tool"). Required, no default. */
  toolNameLabel: string;
  /**
   * Heading for the whole prompt (e.g. "The agent wants to run a tool") —
   * also used as the accessible name of the root `role="group"` region.
   * Required, no default.
   */
  promptTitle: string;
  /**
   * Host-rendered view of the tool's arguments. The library never decides
   * how a JSON payload is displayed — the host owns syntax highlighting,
   * truncation, diffing, or any other representation.
   */
  renderArguments: React.ReactNode;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLFieldSetElement>;
};

/**
 * Host-controlled approval status. Every prop that is only ever rendered in
 * ONE status branch lives on that branch's variant — not on the base props —
 * so the type contract matches exactly what the component reads (mirrors
 * MosaicUrlScraperState's status-driven shape).
 */
export type MosaicApprovalPromptState =
  | {
      status: "pending";
      /** Called when the host user approves the pending tool call. */
      onApprove: () => void;
      /** Called when the host user denies the pending tool call. */
      onDeny: () => void;
      /** Label for the approve button. Required, no default. */
      approveButtonLabel: string;
      /** Label for the deny button. Required, no default. */
      denyButtonLabel: string;
    }
  | {
      status: "responded";
      /** Which decision was sent — drives the message's visual tone only. */
      decision: "approved" | "denied";
      /**
       * Host-provided, host-localized message describing the sent decision
       * (e.g. "Approved — running", "Denied by user"). The library never
       * generates its own copy — every occurrence is a distinct required
       * value supplied by the caller.
       */
      decisionMessage: string;
    }
  | {
      status: "error";
      /**
       * Host-provided, host-localized error message (e.g. "Decision could
       * not be sent", "Agent runtime unreachable"). Required, no default.
       */
      errorMessage: string;
    };

export type MosaicApprovalPromptProps = MosaicApprovalPromptBaseProps & MosaicApprovalPromptState;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicApprovalPrompt — production tool-call approval atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders the requested tool + host-rendered
 * arguments + the current status (pending/responded/error), and reports an
 * approve/deny decision via callbacks. No network call, no SDK, no built-in
 * copy, no built-in arguments renderer.
 */
export function MosaicApprovalPrompt(props: MosaicApprovalPromptProps) {
  const { toolName, toolNameLabel, promptTitle, renderArguments, className, ref } = props;

  const tone =
    props.status === "responded" ? props.decision : props.status === "error" ? "error" : "pending";

  return (
    <fieldset
      ref={ref}
      data-slot="approval-prompt"
      aria-label={promptTitle}
      className={cn("border-0 p-0 m-0", approvalPromptCardVariants({ tone }), className)}
    >
      <legend data-slot="approval-prompt-title" className="text-base font-semibold md:text-lg">
        {promptTitle}
      </legend>

      <div data-slot="approval-prompt-tool" className="flex flex-col gap-1">
        <span
          data-slot="approval-prompt-tool-label"
          className={approvalPromptMessageVariants({ tone: "muted" })}
        >
          {toolNameLabel}
        </span>
        <span data-slot="approval-prompt-tool-name" className="text-sm font-medium">
          {toolName}
        </span>
      </div>

      <div data-slot="approval-prompt-arguments">{renderArguments}</div>

      {props.status === "pending" && (
        <div data-slot="approval-prompt-actions" className="flex gap-2">
          <button
            type="button"
            data-slot="approval-prompt-approve-button"
            onClick={props.onApprove}
            className={approvalPromptButtonVariants({ intent: "approve" })}
          >
            {props.approveButtonLabel}
          </button>
          <button
            type="button"
            data-slot="approval-prompt-deny-button"
            onClick={props.onDeny}
            className={approvalPromptButtonVariants({ intent: "deny" })}
          >
            {props.denyButtonLabel}
          </button>
        </div>
      )}

      {props.status === "responded" && (
        <p
          data-slot="approval-prompt-decision"
          className={approvalPromptMessageVariants({ tone: props.decision })}
        >
          {props.decisionMessage}
        </p>
      )}

      {props.status === "error" && (
        <p
          data-slot="approval-prompt-error"
          className={approvalPromptMessageVariants({ tone: "error" })}
        >
          {props.errorMessage}
        </p>
      )}
    </fieldset>
  );
}

MosaicApprovalPrompt.displayName = "MosaicApprovalPrompt";
