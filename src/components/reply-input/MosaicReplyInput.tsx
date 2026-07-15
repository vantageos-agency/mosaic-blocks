/**
 * MosaicReplyInput — presentational, controlled reply input scoped to one thread
 *
 * Presentational atom. Gives follow-up to a single agent/thread without
 * mixing it into the general flow: it renders a host-supplied thread-context
 * node above a multi-line, auto-growing textarea, plus Send and Cancel
 * buttons. The component performs no network call and holds no message
 * state: the current text is fully host-controlled (`value` +
 * `onValueChange`), the thread it replies into is a host-supplied node
 * (`context`), and `onSubmit(text)` / `onCancel()` are pure prop callbacks.
 *
 * Local behaviour (no network involved): Enter (without Shift) submits the
 * trimmed value; Shift+Enter inserts a newline; the textarea auto-grows with
 * the content up to a max height, then scrolls.
 *
 * Pattern: MosaicChatComposer.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --background, --muted-foreground, --border,
 * --ring, --card.
 * No icon library dependency — plain glyphs ("↑" send / "×" cancel), matching
 * the chat-composer / url-scraper convention. Glyphs are `aria-hidden`; the
 * accessible name comes from the required `sendButtonAriaLabel` /
 * `cancelButtonAriaLabel` props.
 * a11y: the textarea has a required accessible name (`textareaAriaLabel`);
 * the thread-context region has a required accessible name
 * (`contextAriaLabel`) distinguishing it, for assistive technology, from the
 * general conversation flow.
 * Bilingual: every user-facing string (`textareaAriaLabel`, `placeholder`,
 * `contextAriaLabel`, `sendButtonAriaLabel`, `cancelButtonAriaLabel`) is a
 * required caller-supplied prop — zero hardcoded copy, zero default. The
 * thread context itself is a host-supplied `React.ReactNode` (`context`):
 * the library never invents the wording that identifies which thread a
 * reply targets.
 *
 * @example
 * <MosaicReplyInput
 *   value={value}
 *   onValueChange={setValue}
 *   onSubmit={(text) => postReply(threadId, text)}
 *   onCancel={() => closeReplyBox()}
 *   context={<span>Replying to {agentName}</span>}
 *   contextAriaLabel="Thread this reply targets"
 *   textareaAriaLabel="Reply in this thread"
 *   placeholder="Write your reply..."
 *   sendButtonAriaLabel="Send reply"
 *   cancelButtonAriaLabel="Cancel reply"
 * />
 */

import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  replyInputActionButtonVariants,
  replyInputContextVariants,
  replyInputRootVariants,
  replyInputTextareaVariants,
} from "./reply-input-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicReplyInputProps = {
  /** Host-controlled current textarea value. */
  value: string;
  /** Called with the raw textarea value on every keystroke. */
  onValueChange: (value: string) => void;
  /** Called with the trimmed value on Enter (no Shift) or send-button click. */
  onSubmit: (text: string) => void;
  /** Called when the cancel button is activated. */
  onCancel: () => void;
  /**
   * Host-supplied node identifying the thread this reply targets (e.g. the
   * agent/message it replies to). The library never invents this wording.
   */
  context: React.ReactNode;
  /** Accessible name for the thread-context region. Required, no default. */
  contextAriaLabel: string;
  /** Accessible name for the textarea (`aria-label`). Required, no default. */
  textareaAriaLabel: string;
  /** Placeholder text for the textarea. Required, no default. */
  placeholder: string;
  /** Accessible name for the send button. Required, no default. */
  sendButtonAriaLabel: string;
  /** Accessible name for the cancel button. Required, no default. */
  cancelButtonAriaLabel: string;
  /** Disables every control (e.g. host-level connectivity loss). */
  disabled?: boolean;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLFormElement>;
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicReplyInput — production reply-input atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders a host-supplied thread-context node, a
 * controlled auto-growing textarea, and Send/Cancel buttons. No network
 * call, no message history, no built-in copy.
 */
export function MosaicReplyInput(props: MosaicReplyInputProps) {
  const {
    value,
    onValueChange,
    onSubmit,
    onCancel,
    context,
    contextAriaLabel,
    textareaAriaLabel,
    placeholder,
    sendButtonAriaLabel,
    cancelButtonAriaLabel,
    disabled = false,
    className,
    ref,
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedValue = value.trim();

  // Auto-grow: `value` drives the resize on every content change even though
  // the effect body reads `textareaRef.current`, not `value`, by design.
  // biome-ignore lint/correctness/useExhaustiveDependencies: value is the intentional resize trigger
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const submitValue = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) {
      return;
    }
    onSubmit(text);
  }, [disabled, onSubmit, value]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitValue();
    },
    [submitValue],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitValue();
      }
    },
    [submitValue],
  );

  return (
    <form
      ref={ref}
      data-slot="reply-input"
      className={cn(replyInputRootVariants(), className)}
      onSubmit={handleSubmit}
    >
      <div
        aria-label={contextAriaLabel}
        className={replyInputContextVariants()}
        data-slot="reply-input-context"
      >
        {context}
      </div>
      <textarea
        data-slot="reply-input-textarea"
        aria-label={textareaAriaLabel}
        className={replyInputTextareaVariants()}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex min-h-9 items-center justify-end gap-2 px-3 pt-1 pb-2">
        <button
          aria-label={cancelButtonAriaLabel}
          className={replyInputActionButtonVariants({ tone: "cancel" })}
          data-slot="reply-input-cancel-button"
          disabled={disabled}
          onClick={onCancel}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          aria-label={sendButtonAriaLabel}
          className={replyInputActionButtonVariants({ tone: "send" })}
          data-slot="reply-input-send-button"
          disabled={disabled || trimmedValue.length === 0}
          type="submit"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </form>
  );
}

MosaicReplyInput.displayName = "MosaicReplyInput";
