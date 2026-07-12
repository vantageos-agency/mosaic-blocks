/**
 * MosaicChatComposer — presentational, controlled chat input + send/stop button
 *
 * Presentational atom. Renders a multi-line, auto-growing textarea plus a
 * single action button whose ROLE flips between "send" and "stop" depending
 * on `status` — the STOP button (cancel the in-flight agent response) is the
 * library's differentiator versus a plain send-only composer. The component
 * performs no network call and holds no message state: the current text is
 * fully host-controlled (`value` + `onValueChange`), and both `onSubmit(text)`
 * (idle) and `onStop()` (responding) are pure prop callbacks.
 *
 * Local behaviour (no network involved): Enter (without Shift) submits the
 * trimmed value while `status === "idle"`; Shift+Enter inserts a newline; the
 * textarea auto-grows with the content up to a max height, then scrolls.
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module, host-controlled status union as
 * a discriminated prop type).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --background, --muted-foreground, --border,
 * --ring, --card.
 * No icon library — plain glyphs ("↑" send / "■" stop), matching the
 * document-upload / url-scraper convention (no lucide-react runtime
 * dependency). Glyphs are `aria-hidden`; the accessible name comes from the
 * required `sendButtonAriaLabel` / `stopButtonAriaLabel` props.
 * a11y: the textarea has a required accessible name (`textareaAriaLabel`);
 * the action button's accessible name flips with `status`; an
 * `aria-live="polite"` region announces the current action-button label so
 * an assistive-technology user is told when send becomes stop (and back).
 * Bilingual: every user-facing string (`textareaAriaLabel`, `placeholder`,
 * `sendButtonAriaLabel`, `stopButtonAriaLabel`) is a required caller-supplied
 * prop — zero hardcoded copy, zero default.
 *
 * Props are pushed into the `MosaicChatComposerState` discriminated union
 * exactly where they are read: `onSubmit`/`sendButtonAriaLabel` only exist on
 * the "idle" variant (the send button, and the only branch Enter submits
 * from); `onStop`/`stopButtonAriaLabel` only exist on the "responding"
 * variant (the stop button) — declaring `stopButtonAriaLabel` on the base
 * props would force every host to supply a label that is never displayed
 * while idle, which is exactly the "lying prop contract" this library
 * forbids.
 *
 * Ported from any-eve-tpl components/chat/composer.tsx (rewritten from
 * scratch — no shared code, no license carried over): dropped the
 * `disabledReason`/`isPreparing`/tooltip-wrapping/character-limit business
 * logic (app-specific), kept the textarea + auto-submit-on-Enter + send/stop
 * action shape, and promoted the STOP button from "one branch among three"
 * to a first-class discriminated state (host-controlled, not a boolean
 * `isBusy` prop carrying unused fields).
 *
 * @example
 * // idle — can submit
 * <MosaicChatComposer
 *   status="idle"
 *   value={value}
 *   onValueChange={setValue}
 *   onSubmit={(text) => send(text)}
 *   textareaAriaLabel="Message à eve"
 *   placeholder="Demandez ce que vous voulez à eve..."
 *   sendButtonAriaLabel="Envoyer le message"
 * />
 *
 * @example
 * // responding — can stop (the differentiator)
 * <MosaicChatComposer
 *   {...baseProps}
 *   status="responding"
 *   onStop={() => abortResponse()}
 *   stopButtonAriaLabel="Arrêter la réponse"
 * />
 */

import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  chatComposerActionButtonVariants,
  chatComposerRootVariants,
  chatComposerTextareaVariants,
} from "./chat-composer-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Base props required in EVERY status — read unconditionally by the
 * component regardless of `status` (the textarea itself, reachable from both
 * "idle" and "responding").
 */
type MosaicChatComposerBaseProps = {
  /** Host-controlled current textarea value. */
  value: string;
  /** Called with the raw textarea value on every keystroke. */
  onValueChange: (value: string) => void;
  /** Accessible name for the textarea (`aria-label`). Required, no default. */
  textareaAriaLabel: string;
  /** Placeholder text for the textarea. Required, no default. */
  placeholder: string;
  /** Disables the textarea (e.g. host-level connectivity loss). */
  disabled?: boolean;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLFormElement>;
};

/**
 * Host-controlled composer status. `onSubmit` + `sendButtonAriaLabel` are
 * required only while the composer CAN send ("idle"); `onStop` +
 * `stopButtonAriaLabel` are required only while the agent IS responding
 * ("responding") — each field lives exactly on the branch that renders it.
 */
export type MosaicChatComposerState =
  | {
      status: "idle";
      /** Called with the trimmed value on Enter (no Shift) or send-button click. */
      onSubmit: (text: string) => void;
      /** Accessible name for the send button. Required, no default. */
      sendButtonAriaLabel: string;
    }
  | {
      status: "responding";
      /** Called when the stop button is activated — the differentiator. */
      onStop: () => void;
      /** Accessible name for the stop button. Required, no default. */
      stopButtonAriaLabel: string;
    };

export type MosaicChatComposerProps = MosaicChatComposerBaseProps & MosaicChatComposerState;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicChatComposer — production chat-input atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders a controlled, auto-growing textarea and a
 * single action button whose role (send/stop) is driven by `status`. No
 * network call, no message history, no built-in copy.
 */
export function MosaicChatComposer(props: MosaicChatComposerProps) {
  const {
    value,
    onValueChange,
    textareaAriaLabel,
    placeholder,
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
    if (props.status !== "idle") {
      return;
    }
    const text = value.trim();
    if (!text || disabled) {
      return;
    }
    props.onSubmit(text);
  }, [disabled, props, value]);

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

  const currentActionLabel =
    props.status === "responding" ? props.stopButtonAriaLabel : props.sendButtonAriaLabel;

  return (
    <form
      ref={ref}
      data-slot="chat-composer"
      className={cn(chatComposerRootVariants(), className)}
      onSubmit={handleSubmit}
    >
      <textarea
        data-slot="chat-composer-input"
        aria-label={textareaAriaLabel}
        className={chatComposerTextareaVariants()}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex min-h-9 items-center justify-end gap-2 px-3 pt-1 pb-2">
        {props.status === "responding" ? (
          <button
            aria-label={props.stopButtonAriaLabel}
            className={chatComposerActionButtonVariants({ tone: "stop" })}
            data-slot="chat-composer-stop-button"
            onClick={props.onStop}
            type="button"
          >
            <span aria-hidden="true">■</span>
          </button>
        ) : (
          <button
            aria-label={props.sendButtonAriaLabel}
            className={chatComposerActionButtonVariants({ tone: "send" })}
            data-slot="chat-composer-send-button"
            disabled={disabled || trimmedValue.length === 0}
            type="submit"
          >
            <span aria-hidden="true">↑</span>
          </button>
        )}
      </div>
      <span aria-live="polite" className="sr-only" data-slot="chat-composer-status-announcer">
        {currentActionLabel}
      </span>
    </form>
  );
}

MosaicChatComposer.displayName = "MosaicChatComposer";
