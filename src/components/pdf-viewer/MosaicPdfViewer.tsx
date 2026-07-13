/**
 * MosaicPdfViewer — presentational inline PDF preview
 *
 * Presentational atom. Renders a PDF document, given a `fileUrl`, inline via
 * the browser's native PDF renderer (an `<iframe>` pointed at `fileUrl`,
 * optionally suffixed with the standard `#page=`/`#zoom=` viewer fragment).
 * The component performs no network call of its own: it never calls `fetch`
 * or any SDK — the browser's own iframe navigation is what loads `fileUrl`,
 * exactly as it would for any other iframe `src`. The host owns `fileUrl`
 * (including any signing/auth query string) and owns page/zoom state.
 *
 * Page navigation and zoom are both fully host-controlled, exactly like
 * `MosaicUrlScraper`'s `url`/`onUrlChange`: `currentPage`/`onPageChange` and
 * `zoom`/`onZoomChange` are independent optional pairs — the toolbar for a
 * given control only renders when that pair's value prop is supplied, and
 * activating a toolbar button only calls back out; it never mutates local
 * page/zoom state itself.
 *
 * Loading/error status IS local state (not host-controlled): it reflects
 * whether the browser has finished loading `fileUrl` into the iframe.
 * `loadingLabel` is shown until the iframe's native `load` event fires;
 * `errorLabel` replaces the frame if the iframe instead fires a native
 * `error` event (e.g. `fileUrl` unreachable). Changing `fileUrl` resets this
 * local status back to loading — pattern lifted from `MosaicDocumentUpload`'s
 * per-file host-controlled status conventions, applied here to a single
 * host-supplied `fileUrl`.
 *
 * Both listeners are attached with a plain `addEventListener` on the iframe
 * DOM node (via a local `useRef`+`useEffect`), NOT via React's `onLoad`/
 * `onError` JSX props: React only special-cases the `iframe`/`object` tags
 * for its non-delegated-event optimization on `load`, never on `error` (the
 * `error` special-case list only covers `img`/`image`/`source`/`embed`/
 * `link`) — so a React `onError` prop on an `<iframe>` is silently never
 * invoked, in every browser, not just under jsdom. Attaching the listener
 * directly on the node sidesteps React's synthetic-event dispatch entirely
 * and reacts to the DOM event regardless of delegation/bubbling support.
 *
 * Pattern: MosaicUrlScraper.tsx / MosaicDocumentUpload.tsx (data-slot, inline
 * cn, React 19 ref prop, displayName, JSDoc, pure variants module, presentational
 * — host owns fetch, no PDF library dependency: the browser's built-in PDF
 * plugin renders the iframe, exactly like MosaicUrlScraper leans on the
 * browser's own `new URL()` for local syntax validation instead of a parsing
 * library).
 * No "use client" in source — prepend-use-client.mjs adds it to dist; the
 * `useState` below requires the client runtime at use-time.
 * Design tokens: --foreground, --muted-foreground, --border, --destructive,
 * --card, --accent, --background.
 * No icon library — plain glyphs ("‹"/"›"/"−"/"+"), matching the
 * document-upload/url-scraper convention (no lucide-react runtime dependency).
 * a11y: the loading region uses `role="status"`; the error region uses
 * `role="alert"`. The iframe's `title` is `fileUrl` itself — the only
 * caller-independent, non-hardcoded string available to describe "the
 * document this frame is showing" (no new required prop was introduced for
 * this — the JSDoc on the field explains the choice).
 * Bilingual: every user-facing string (`loadingLabel`/`errorLabel`) is a
 * required caller-supplied prop — zero hardcoded copy, zero default.
 *
 * @example
 * <MosaicPdfViewer
 *   fileUrl={documentUrl}
 *   currentPage={page}
 *   onPageChange={setPage}
 *   totalPages={totalPages}
 *   zoom={zoom}
 *   onZoomChange={setZoom}
 *   loadingLabel="Chargement du document…"
 *   errorLabel="Impossible d'afficher ce document."
 * />
 */

import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  pdfViewerFrameVariants,
  pdfViewerStatusVariants,
  pdfViewerToolbarButtonVariants,
} from "./pdf-viewer-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Appends the standard browser-native PDF-viewer fragment (`#page=`/`#zoom=`)
 * to `fileUrl`. Pure string composition — no network call, no PDF parsing.
 */
function buildFrameSrc(fileUrl: string, currentPage: number | undefined, zoom: number | undefined) {
  const fragmentParts: string[] = [];
  if (currentPage !== undefined) fragmentParts.push(`page=${currentPage}`);
  if (zoom !== undefined) fragmentParts.push(`zoom=${Math.round(zoom * 100)}`);
  if (fragmentParts.length === 0) return fileUrl;
  const separator = fileUrl.includes("#") ? "&" : "#";
  return `${fileUrl}${separator}${fragmentParts.join("&")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicPdfViewerProps {
  /** URL of the PDF document to render. The host owns fetching/signing it. */
  fileUrl: string;
  /** Current page, controlled by the host (1-indexed). Omit to hide page controls. */
  currentPage?: number;
  /** Called with the requested page when a page-navigation button is activated. */
  onPageChange?: (page: number) => void;
  /** Total page count, shown next to `currentPage` and used to disable "next" at the end. */
  totalPages?: number;
  /** Current zoom factor (e.g. `1` = 100%), controlled by the host. Omit to hide zoom controls. */
  zoom?: number;
  /** Called with the requested zoom factor when a zoom button is activated. */
  onZoomChange?: (zoom: number) => void;
  /** Message shown while the document is loading. Required, no default. */
  loadingLabel: string;
  /** Message shown if the document fails to load. Required, no default. */
  errorLabel: string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicPdfViewer — production inline-PDF-preview atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders `fileUrl` inline via the browser's native
 * PDF renderer, reports host-controlled page/zoom navigation via callbacks,
 * and surfaces load/error state via `loadingLabel`/`errorLabel`. No network
 * call of its own, no PDF library dependency, no built-in copy.
 */
export function MosaicPdfViewer({
  fileUrl,
  currentPage,
  onPageChange,
  totalPages,
  zoom,
  onZoomChange,
  loadingLabel,
  errorLabel,
  className,
  ref,
}: MosaicPdfViewerProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [trackedFileUrl, setTrackedFileUrl] = useState(fileUrl);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // `fileUrl` changed since the last render — reset local load status.
  // (Render-phase state update, the documented React pattern for
  // "derive state from a changed prop" — no effect needed.)
  if (fileUrl !== trackedFileUrl) {
    setTrackedFileUrl(fileUrl);
    setStatus("loading");
  }

  // Native listeners (see file JSDoc: React's onError never fires on an
  // <iframe>, in any browser). Attached once — the iframe DOM node persists
  // across re-renders; only its `src` attribute changes.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    function handleLoad() {
      setStatus("loaded");
    }
    function handleError() {
      setStatus("error");
    }
    node.addEventListener("load", handleLoad);
    node.addEventListener("error", handleError);
    return () => {
      node.removeEventListener("load", handleLoad);
      node.removeEventListener("error", handleError);
    };
  }, []);

  const showPageControls = currentPage !== undefined;
  const showZoomControls = zoom !== undefined;

  function handlePrevPage() {
    if (currentPage === undefined || onPageChange === undefined || currentPage <= 1) return;
    onPageChange(currentPage - 1);
  }

  function handleNextPage() {
    if (currentPage === undefined || onPageChange === undefined) return;
    if (totalPages !== undefined && currentPage >= totalPages) return;
    onPageChange(currentPage + 1);
  }

  function handleZoomOut() {
    if (zoom === undefined || onZoomChange === undefined) return;
    onZoomChange(Math.round((zoom - 0.1) * 100) / 100);
  }

  function handleZoomIn() {
    if (zoom === undefined || onZoomChange === undefined) return;
    onZoomChange(Math.round((zoom + 0.1) * 100) / 100);
  }

  return (
    <div ref={ref} data-slot="pdf-viewer" className={cn("flex flex-col gap-2", className)}>
      {(showPageControls || showZoomControls) && (
        <div
          data-slot="pdf-viewer-toolbar"
          className="flex items-center justify-between gap-2 text-sm"
        >
          {showPageControls && (
            <div data-slot="pdf-viewer-page-controls" className="flex items-center gap-2">
              <button
                type="button"
                data-slot="pdf-viewer-prev-page-button"
                onClick={handlePrevPage}
                disabled={(currentPage ?? 1) <= 1}
                className={pdfViewerToolbarButtonVariants()}
              >
                ‹
              </button>
              <span data-slot="pdf-viewer-page-indicator">
                {currentPage}
                {totalPages !== undefined ? ` / ${totalPages}` : ""}
              </span>
              <button
                type="button"
                data-slot="pdf-viewer-next-page-button"
                onClick={handleNextPage}
                disabled={totalPages !== undefined && (currentPage ?? 0) >= totalPages}
                className={pdfViewerToolbarButtonVariants()}
              >
                ›
              </button>
            </div>
          )}
          {showZoomControls && (
            <div data-slot="pdf-viewer-zoom-controls" className="flex items-center gap-2">
              <button
                type="button"
                data-slot="pdf-viewer-zoom-out-button"
                onClick={handleZoomOut}
                className={pdfViewerToolbarButtonVariants()}
              >
                −
              </button>
              <span data-slot="pdf-viewer-zoom-indicator">{Math.round((zoom ?? 1) * 100)}%</span>
              <button
                type="button"
                data-slot="pdf-viewer-zoom-in-button"
                onClick={handleZoomIn}
                className={pdfViewerToolbarButtonVariants()}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      <div data-slot="pdf-viewer-frame-container" className={pdfViewerFrameVariants()}>
        {status === "loading" && (
          <output
            data-slot="pdf-viewer-loading"
            className={pdfViewerStatusVariants({ tone: "loading" })}
          >
            {loadingLabel}
          </output>
        )}
        {status === "error" && (
          <div
            data-slot="pdf-viewer-error"
            role="alert"
            className={pdfViewerStatusVariants({ tone: "error" })}
          >
            {errorLabel}
          </div>
        )}
        <iframe
          ref={frameRef}
          data-slot="pdf-viewer-frame"
          src={buildFrameSrc(fileUrl, currentPage, zoom)}
          title={fileUrl}
          className={cn(
            "h-full min-h-64 w-full border-0",
            status !== "loaded" && "pointer-events-none absolute inset-0 opacity-0",
          )}
        />
      </div>
    </div>
  );
}

MosaicPdfViewer.displayName = "MosaicPdfViewer";
