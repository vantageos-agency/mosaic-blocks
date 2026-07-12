/**
 * MosaicApiKeyPanel — presentational "bring your own key" (BYOK) panel.
 *
 * Presentational atom. Renders per-provider tabs (data-driven — the host
 * supplies the provider list, never a hardcoded set), a masked
 * (`type="password"`) key input, a validate button, and one of four
 * host-controlled statuses: at rest (idle), validating, valid (with a
 * masked hint of the last 4 characters of an already-saved key), or
 * invalid (with a host-supplied error message). The component never
 * contacts any server or SDK: submitting the form calls the host callback
 * `onValidate(providerId, key)` — the host owns how the key is checked
 * against its provider (Vercel AI Gateway, OpenRouter, or anything else it
 * lists) and how long it takes.
 *
 * Security (non-negotiable, see JSDoc on each prop below): the raw key is
 * never logged, never written to storage by this library, and never
 * placed in any DOM attribute other than the password input's own
 * `value` (the same place any host-controlled `<input type="password">`
 * necessarily holds it while the user types). No `console.*` call touches
 * the key. Only the last 4 characters of an *already-saved* key are ever
 * displayed, and only because the host explicitly supplies them via
 * `savedKeyLastFour` on the "valid" branch — this component computes
 * nothing from a live key itself.
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module, host-controlled status union
 * as a discriminated prop type, per-branch required props).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted-foreground, --border, --destructive,
 * --ring, --accent, --card, --background.
 * No icon library.
 * a11y: the provider selector is a `role="radiogroup"` with a required
 * `tabsAriaLabel`; each tab is a `role="radio"` with `aria-checked`; the
 * key input has a required accessible name; the validating region uses
 * `role="status"`.
 * Bilingual: every user-facing string (tab labels/tabs aria-label/input
 * aria-label/validate button label/validating label/saved-key hint
 * label/remove button label/error message) is a required caller-supplied
 * prop — zero hardcoded copy, zero default.
 *
 * Ported from any-debate-ai (Eve) apps/web/src/lib/components/
 * ApiKeyDialog.svelte + apiKey.svelte.ts (rewritten from scratch — no
 * shared code, no license carried over): dropped the modal-dialog chrome,
 * the localStorage persistence (`modelKey` store — presentational
 * libraries never own storage, the host does), the hardcoded gateway/
 * openrouter provider table (now host-supplied `providers` data), and the
 * direct Convex `action` call (now the `onValidate` callback — this
 * library talks to no server). Kept: per-provider tab toggle, masked
 * input, validate/checking/error states, and the "last 4 characters of a
 * saved key" hint pattern.
 *
 * Props are pushed into the `MosaicApiKeyPanelState` discriminated union
 * exactly where they are read — no prop is required in a status branch
 * that never renders it (e.g. `validatingLabel` only exists on the
 * "validating" variant; `savedKeyLastFour`/`savedKeyHintLabel`/
 * `removeButtonLabel`/`onRemove` only on "valid"; `errorMessage` only on
 * "invalid").
 *
 * @example
 * // idle
 * <MosaicApiKeyPanel
 *   status="idle"
 *   providers={[
 *     { id: "gateway", label: "Vercel AI Gateway", placeholder: "vck_…" },
 *     { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-v1-…" },
 *   ]}
 *   activeProviderId="gateway"
 *   onProviderChange={setActiveProviderId}
 *   tabsAriaLabel="Fournisseur de clé"
 *   keyValue={draft}
 *   onKeyChange={setDraft}
 *   onValidate={(providerId, key) => validate(providerId, key)}
 *   inputAriaLabel="Clé API"
 *   validateButtonLabel="Valider et entrer"
 * />
 *
 * @example
 * // valid (a key is already saved)
 * <MosaicApiKeyPanel
 *   {...baseProps}
 *   status="valid"
 *   savedKeyLastFour="a1b2"
 *   savedKeyHintLabel={(lastFour) => `Une clé se terminant par …${lastFour} est enregistrée.`}
 *   removeButtonLabel="Retirer"
 *   onRemove={() => removeKey()}
 * />
 */

import type * as React from "react";
import {
  apiKeyPanelInputVariants,
  apiKeyPanelMessageVariants,
  apiKeyPanelTabVariants,
} from "./api-key-panel-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Host-supplied model-key provider (tab), e.g. Vercel AI Gateway / OpenRouter. */
export interface MosaicApiKeyPanelProvider {
  /** Stable provider identifier, e.g. "gateway" / "openrouter". */
  id: string;
  /** Tab label, displayed as-is. */
  label: string;
  /** Placeholder for the key input when this provider is active. */
  placeholder: string;
}

/**
 * Base props required in EVERY status — read unconditionally by the
 * component regardless of `status` (provider tabs + key input + submit
 * row, all reachable from "idle").
 */
type MosaicApiKeyPanelBaseProps = {
  /** Host-supplied provider list. Data, never a hardcoded set. */
  providers: MosaicApiKeyPanelProvider[];
  /** `id` of the currently-selected provider (must match a `providers[].id`). */
  activeProviderId: string;
  /** Called with the provider `id` when a tab is activated. */
  onProviderChange: (providerId: string) => void;
  /** Accessible name for the provider tab group (`aria-label`). Required, no default. */
  tabsAriaLabel: string;
  /**
   * Host-controlled current key input value. Never persisted by this
   * library (no localStorage) — the host owns where, if anywhere, this
   * value is kept.
   */
  keyValue: string;
  /** Called with the raw input value on every keystroke. */
  onKeyChange: (key: string) => void;
  /**
   * Called with the active provider id and the trimmed key on submit.
   * The component performs no validation itself — the host decides how
   * the key is checked and how `status`/`errorMessage` are updated
   * afterward. Never call this with an empty key.
   */
  onValidate: (providerId: string, key: string) => void;
  /** Accessible name for the key input (`aria-label`). Required, no default. */
  inputAriaLabel: string;
  /** Label for the submit button when idle/ready. Required, no default. */
  validateButtonLabel: string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * Host-controlled key-validation status. Every prop that is only ever
 * rendered in ONE status branch lives on that branch's variant — not on
 * the base props — so the type contract matches exactly what the
 * component reads.
 */
export type MosaicApiKeyPanelState =
  | { status: "idle" }
  | {
      status: "validating";
      /** Message/label shown while status === "validating". Required, no default. */
      validatingLabel: string;
    }
  | {
      status: "valid";
      /**
       * Last 4 characters of an already-saved key, supplied by the host
       * (this library never derives this from a live key value itself —
       * it only ever displays what the host explicitly hands it).
       */
      savedKeyLastFour: string;
      /**
       * Host-localized hint text, e.g.
       * `(lastFour) => \`Key ending in …${lastFour} is saved.\``.
       * Required — no hardcoded string.
       */
      savedKeyHintLabel: (lastFour: string) => string;
      /** Label for the "remove saved key" button. Required, no default. */
      removeButtonLabel: string;
      /** Called when the "remove saved key" button is activated. */
      onRemove: () => void;
    }
  | {
      status: "invalid";
      /**
       * Host-provided, host-localized error message. The library never
       * generates its own error strings, and never derives one from the
       * rejected key — every occurrence is a distinct required value
       * supplied by the caller.
       */
      errorMessage: string;
    };

export type MosaicApiKeyPanelProps = MosaicApiKeyPanelBaseProps & MosaicApiKeyPanelState;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicApiKeyPanel — production BYOK ("bring your own key") atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders provider tabs, a masked key input, and
 * the current status (idle/validating/valid/invalid), and reports a
 * provider change / validate request / remove request via callbacks. No
 * network call, no storage, no key logging.
 */
export function MosaicApiKeyPanel(props: MosaicApiKeyPanelProps) {
  const {
    providers,
    activeProviderId,
    onProviderChange,
    tabsAriaLabel,
    keyValue,
    onKeyChange,
    onValidate,
    inputAriaLabel,
    validateButtonLabel,
    className,
    ref,
  } = props;

  const isBusy = props.status === "validating";
  const activeProvider = providers.find((provider) => provider.id === activeProviderId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = keyValue.trim();
    if (!trimmed || isBusy) return;
    onValidate(activeProviderId, trimmed);
  }

  function handleKeyChange(event: React.ChangeEvent<HTMLInputElement>) {
    onKeyChange(event.target.value);
  }

  return (
    <div ref={ref} data-slot="api-key-panel" className={cn("flex flex-col gap-3", className)}>
      <div
        data-slot="api-key-panel-tabs"
        role="radiogroup"
        aria-label={tabsAriaLabel}
        className="flex gap-1 rounded-lg border border-border bg-background p-1"
      >
        {providers.map((provider) => (
          <label
            key={provider.id}
            data-slot="api-key-panel-tab"
            className={apiKeyPanelTabVariants({ active: provider.id === activeProviderId })}
          >
            <input
              type="radio"
              className="sr-only"
              name="api-key-panel-provider"
              value={provider.id}
              checked={provider.id === activeProviderId}
              disabled={isBusy}
              onChange={() => onProviderChange(provider.id)}
            />
            {provider.label}
          </label>
        ))}
      </div>

      <form data-slot="api-key-panel-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          data-slot="api-key-panel-input"
          aria-label={inputAriaLabel}
          placeholder={activeProvider?.placeholder}
          value={keyValue}
          onChange={handleKeyChange}
          disabled={isBusy}
          autoComplete="off"
          spellCheck={false}
          className={apiKeyPanelInputVariants({ invalid: props.status === "invalid" })}
        />
        <button
          type="submit"
          data-slot="api-key-panel-submit-button"
          disabled={isBusy || keyValue.trim().length === 0}
          className="min-h-9 inline-flex w-fit items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent/50 disabled:opacity-50"
        >
          {props.status === "validating" ? props.validatingLabel : validateButtonLabel}
        </button>
      </form>

      {props.status === "validating" && (
        <output data-slot="api-key-panel-validating">
          <p className={apiKeyPanelMessageVariants({ tone: "muted" })}>{props.validatingLabel}</p>
        </output>
      )}

      {props.status === "invalid" && (
        <p
          data-slot="api-key-panel-error-message"
          className={apiKeyPanelMessageVariants({ tone: "error" })}
        >
          {props.errorMessage}
        </p>
      )}

      {props.status === "valid" && (
        <div
          data-slot="api-key-panel-saved-hint"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span data-slot="api-key-panel-saved-hint-text">
            {props.savedKeyHintLabel(props.savedKeyLastFour)}
          </span>
          <button
            type="button"
            data-slot="api-key-panel-remove-button"
            onClick={props.onRemove}
            className="cursor-pointer border-none bg-transparent p-0 text-sm text-foreground underline decoration-ring underline-offset-4 hover:decoration-foreground"
          >
            {props.removeButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
}

MosaicApiKeyPanel.displayName = "MosaicApiKeyPanel";
