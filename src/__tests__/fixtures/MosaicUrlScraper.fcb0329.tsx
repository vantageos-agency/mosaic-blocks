/**
 * MosaicUrlScraper — presentational URL-input + scraped-content preview
 *
 * Presentational atom. Renders a URL input + submit button and, below it,
 * one of three host-controlled states: a loading indicator, a scraped
 * content preview (title/description/optional image/link), or an error
 * message. The component never performs a network call: submitting a
 * syntactically-valid URL is surfaced via `onScrape(url: string)` — the
 * host owns how the page is actually fetched/scraped, how long it takes,
 * and what counts as an error (invalid URL, unreachable page, empty
 * content are all just different host-supplied `errorMessage` values).
 *
 * Local behaviour (no network involved): a client-side URL-syntax check via
 * `new URL()` runs on submit so a malformed URL is caught immediately
 * without a host round-trip. This mirrors the source app's own
 * `isValidUrl` check — it is UI validation, not a scrape.
 *
 * Pattern: MosaicDocumentUpload.tsx (data-slot, inline cn, React 19 ref
 * prop, displayName, JSDoc, pure variants module, host-controlled status
 * union as a discriminated prop type).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted, --muted-foreground, --border,
 * --destructive, --ring, --accent, --card, --background.
 * No icon library — uses a plain "↗" glyph for the external link, matching
 * the document-upload convention (no lucide-react runtime dependency).
 * a11y: input has a required accessible name; the external link has a
 * required per-content accessible name; the loading region uses
 * role="status".
 * Bilingual: every user-facing string (placeholder/button labels/loading
 * message/invalid-URL message/error message/reset label/link+image
 * accessible names) is a required caller-supplied prop — zero hardcoded
 * copy, zero default.
 *
 * Ported from any-debate-ai components/memory/url-scraper.tsx (rewritten
 * from scratch — no shared code, no license carried over): dropped the
 * embedded mock "AI-extracted memories" review UI (app-specific business
 * logic, same call as document-upload's dropped mock-extraction review)
 * and the network/simulation logic (violates presentational-component
 * rule), kept the URL input + scrape action + scraped-content preview +
 * error-state shape.
 *
 * @example
 * <MosaicUrlScraper
 *   status={status}
 *   url={url}
 *   onUrlChange={setUrl}
 *   onScrape={(scrapedUrl) => scrapePage(scrapedUrl)}
 *   onReset={() => reset()}
 *   inputAriaLabel="URL de la page à aspirer"
 *   inputPlaceholder="https://exemple.com/article"
 *   scrapeButtonLabel="Aspirer"
 *   scrapingLabel="Aspiration en cours"
 *   loadingMessage="Récupération du contenu de la page…"
 *   invalidUrlMessage="Veuillez saisir une URL valide"
 *   resetButtonLabel="Aspirer une autre page"
 *   openLinkAriaLabel={(pageUrl) => `Ouvrir ${pageUrl} dans un nouvel onglet`}
 *   imageAlt={(title) => `Aperçu de ${title}`}
 *   content={content}
 *   errorMessage={errorMessage}
 * />
 */

import type * as React from "react";
import { useState } from "react";
import {
  urlScraperCardVariants,
  urlScraperInputVariants,
  urlScraperMessageVariants,
} from "./url-scraper-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function isSyntacticallyValidUrl(candidate: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(candidate);
    return true;
  } catch {
    return false;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Host-supplied scraped page content, shown once status === "success". */
export interface MosaicUrlScraperContent {
  /** Scraped page title, displayed as-is. */
  title: string;
  /** Scraped page description/summary, displayed as-is. */
  description: string;
  /** Optional preview image URL — the image is rendered only when present. */
  image?: string;
  /** The scraped page's canonical URL, used as the external-link href. */
  url: string;
}

/**
 * Host-controlled scrape status, discriminating which of `content` /
 * `errorMessage` is required — mirrors MosaicDocumentUploadFile's
 * status-driven shape.
 */
export type MosaicUrlScraperState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; content: MosaicUrlScraperContent }
  | {
      status: "error";
      /**
       * Host-provided, host-localized error message (e.g. "Invalid URL",
       * "Page unreachable", "Empty content"). The library never generates
       * its own error strings — every occurrence is a distinct required
       * value supplied by the caller.
       */
      errorMessage: string;
    };

export type MosaicUrlScraperProps = MosaicUrlScraperState & {
  /** Host-controlled current input value. */
  url: string;
  /** Called with the raw input value on every keystroke. */
  onUrlChange: (url: string) => void;
  /**
   * Called with the trimmed URL once it passes local syntax validation.
   * The component performs no scrape itself — the host decides how the
   * page is fetched and how `status`/`content`/`errorMessage` are updated
   * afterward.
   */
  onScrape: (url: string) => void;
  /** Called when the reset/"scrape another" button is activated. */
  onReset: () => void;
  /** Accessible name for the URL input (`aria-label`). Required, no default. */
  inputAriaLabel: string;
  /** Placeholder text for the URL input. Required, no default. */
  inputPlaceholder: string;
  /** Label for the submit button when idle/ready. Required, no default. */
  scrapeButtonLabel: string;
  /** Label for the submit button while status === "loading". Required, no default. */
  scrapingLabel: string;
  /** Label for the reset/"scrape another" button. Required, no default. */
  resetButtonLabel: string;
  /**
   * Message shown when the local `new URL()` syntax check fails on submit.
   * Required, no default — this is host copy, not an English fallback.
   */
  invalidUrlMessage: string;
  /** Message shown inside the loading region while status === "loading". Required, no default. */
  loadingMessage: string;
  /**
   * Per-content accessible name for the external "open" link, e.g.
   * `(pageUrl) => \`Open ${pageUrl}\``. Required — no hardcoded string.
   */
  openLinkAriaLabel: (pageUrl: string) => string;
  /**
   * Per-content alt text for the optional preview image, e.g.
   * `(title) => \`Preview of ${title}\``. Required — invoked only when
   * `content.image` is present.
   */
  imageAlt: (title: string) => string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicUrlScraper — production URL-scraper atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders the URL input, the current status
 * (loading/success/error), and reports a validated scrape request / reset
 * via callbacks. No network call, no scraping simulation, no built-in copy.
 */
export function MosaicUrlScraper(props: MosaicUrlScraperProps) {
  const {
    url,
    onUrlChange,
    onScrape,
    onReset,
    inputAriaLabel,
    inputPlaceholder,
    scrapeButtonLabel,
    scrapingLabel,
    resetButtonLabel,
    invalidUrlMessage,
    loadingMessage,
    openLinkAriaLabel,
    imageAlt,
    className,
    ref,
  } = props;

  const [isLocallyInvalid, setIsLocallyInvalid] = useState(false);
  const isBusy = props.status === "loading" || props.status === "success";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!isSyntacticallyValidUrl(trimmed)) {
      setIsLocallyInvalid(true);
      return;
    }
    setIsLocallyInvalid(false);
    onScrape(trimmed);
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsLocallyInvalid(false);
    onUrlChange(event.target.value);
  }

  return (
    <div ref={ref} data-slot="url-scraper" className={cn("flex flex-col gap-4", className)}>
      <form
        data-slot="url-scraper-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 md:flex-row"
      >
        <input
          type="url"
          data-slot="url-scraper-input"
          aria-label={inputAriaLabel}
          placeholder={inputPlaceholder}
          value={url}
          onChange={handleUrlChange}
          disabled={isBusy}
          className={urlScraperInputVariants({ invalid: isLocallyInvalid })}
        />
        <button
          type="submit"
          data-slot="url-scraper-submit-button"
          disabled={isBusy}
          className="min-h-9 inline-flex items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent/50 disabled:opacity-50"
        >
          {props.status === "loading" ? scrapingLabel : scrapeButtonLabel}
        </button>
      </form>

      {isLocallyInvalid && (
        <p
          data-slot="url-scraper-invalid-message"
          className={urlScraperMessageVariants({ tone: "error" })}
        >
          {invalidUrlMessage}
        </p>
      )}

      {props.status === "loading" && (
        <output
          data-slot="url-scraper-loading"
          className={urlScraperCardVariants({ tone: "neutral" })}
        >
          <p className={urlScraperMessageVariants({ tone: "muted" })}>{loadingMessage}</p>
        </output>
      )}

      {props.status === "error" && (
        <div data-slot="url-scraper-error" className={urlScraperCardVariants({ tone: "error" })}>
          <p
            data-slot="url-scraper-error-message"
            className={urlScraperMessageVariants({ tone: "error" })}
          >
            {props.errorMessage}
          </p>
          <button
            type="button"
            data-slot="url-scraper-reset-button"
            onClick={onReset}
            className="min-h-9 inline-flex w-fit items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent/50"
          >
            {resetButtonLabel}
          </button>
        </div>
      )}

      {props.status === "success" && (
        <div
          data-slot="url-scraper-content"
          className={urlScraperCardVariants({ tone: "neutral" })}
        >
          {props.content.image !== undefined && (
            <img
              data-slot="url-scraper-image"
              src={props.content.image}
              alt={imageAlt(props.content.title)}
              className="h-32 w-full rounded-md object-cover md:h-48"
            />
          )}
          <div className="flex items-start justify-between gap-2">
            <h3 data-slot="url-scraper-title" className="text-base font-semibold md:text-lg">
              {props.content.title}
            </h3>
            <a
              data-slot="url-scraper-link"
              href={props.content.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openLinkAriaLabel(props.content.url)}
              className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ↗
            </a>
          </div>
          <p
            data-slot="url-scraper-description"
            className={urlScraperMessageVariants({ tone: "muted" })}
          >
            {props.content.description}
          </p>
          <button
            type="button"
            data-slot="url-scraper-reset-button"
            onClick={onReset}
            className="min-h-9 inline-flex w-fit items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent/50"
          >
            {resetButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
}

MosaicUrlScraper.displayName = "MosaicUrlScraper";
