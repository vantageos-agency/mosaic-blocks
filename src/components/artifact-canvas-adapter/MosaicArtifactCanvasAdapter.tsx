/**
 * MosaicArtifactCanvasAdapter — dual-source artifact runtime chrome.
 *
 * Absorbs the 4 any-debate-ai runtime concerns (canvas-toggle, artifact-canvas,
 * artifact-renderer, artifact-toolbar) behind ONE presentation layer that
 * renders under either runtime source:
 *
 *   (a) @ai-sdk-tools/artifacts — pass `source={{ kind: "ai-sdk-artifacts", ... }}`
 *   (b) MCP Apps ui:// bridge   — pass `source={{ kind: "mcp-ui", ... }}`
 *
 * Both are normalized by `normalizeArtifact` (./normalize.ts) into one
 * `NormalizedArtifact` shape before this component ever touches them — this
 * component itself never branches on `source.kind` beyond that single call.
 *
 * i18n: zero hardcoded user-facing strings (mosaic-blocks doctrine — see
 * src/__tests__/i18n-no-hardcoded-literals.test.ts). Every label is a
 * required prop; the host owns the language.
 *
 * data-slot="artifact-canvas-adapter" on the root, "artifact-canvas-toggle"
 * on the toggle button, "artifact-canvas-toolbar" on the toolbar,
 * "artifact-canvas-body" on the rendered artifact region.
 */

import type * as React from "react";
import { normalizeArtifact } from "./normalize.js";
import type { ArtifactCanvasSource, ArtifactType } from "./types.js";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicArtifactCanvasAdapterLabels {
  /** Accessible name for the collapsed-state toggle button. */
  toggleLabel: string;
  /** Accessible name for the canvas close button. */
  closeLabel: string;
  /** Region heading shown in the toolbar when the canvas is open. */
  toolbarHeading: string;
  /** Heading shown when no artifact is active. */
  emptyTitle: string;
  /** Body copy shown when no artifact is active. */
  emptyBody: string;
  /** Heading shown when the source resolves to no renderable artifact. */
  notFoundTitle: string;
  /** Body copy shown when the source resolves to no renderable artifact. */
  notFoundBody: string;
  /** Localizes the artifact type badge, e.g. (t) => ({ document: "Document", ... })[t]. */
  typeLabel: (type: ArtifactType) => string;
}

export interface MosaicArtifactCanvasAdapterProps {
  /** Either runtime source; `null` renders the empty state. */
  source: ArtifactCanvasSource | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  labels: MosaicArtifactCanvasAdapterLabels;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function MosaicArtifactCanvasAdapter({
  source,
  isOpen,
  onToggle,
  onClose,
  labels,
  className,
  ref,
}: MosaicArtifactCanvasAdapterProps) {
  const artifact = source ? normalizeArtifact(source) : null;

  return (
    <div ref={ref} data-slot="artifact-canvas-adapter" className={cn("relative", className)}>
      <button
        type="button"
        data-slot="artifact-canvas-toggle"
        aria-label={labels.toggleLabel}
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium",
          "outline-none transition-colors",
          "focus-visible:ring-ring focus-visible:ring-[3px]",
          "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        {labels.toggleLabel}
      </button>

      {isOpen && (
        <section
          aria-label={labels.toolbarHeading}
          data-slot="artifact-canvas"
          className={cn(
            "mt-2 flex flex-col rounded-lg border border-border bg-background",
            "shadow-xs",
          )}
        >
          <div
            data-slot="artifact-canvas-toolbar"
            className="flex items-center justify-between border-border border-b px-4 py-2"
          >
            <span className="font-medium text-sm">{labels.toolbarHeading}</span>
            <button
              type="button"
              aria-label={labels.closeLabel}
              onClick={onClose}
              className={cn(
                "rounded-md p-1 outline-none transition-colors",
                "focus-visible:ring-ring focus-visible:ring-[3px]",
                "hover:bg-muted",
              )}
            >
              {labels.closeLabel}
            </button>
          </div>

          <div data-slot="artifact-canvas-body" className="flex-1 p-4">
            {!source && (
              <div className="text-center">
                <p className="font-medium text-muted-foreground">{labels.emptyTitle}</p>
                <p className="mt-1 text-muted-foreground/70 text-sm">{labels.emptyBody}</p>
              </div>
            )}

            {source && !artifact && (
              <div className="text-center">
                <p className="font-medium text-muted-foreground">{labels.notFoundTitle}</p>
                <p className="mt-1 text-muted-foreground/70 text-sm">{labels.notFoundBody}</p>
              </div>
            )}

            {artifact && (
              <div data-slot="artifact-canvas-artifact" data-artifact-type={artifact.type}>
                <div className="flex items-center gap-2">
                  <span
                    data-slot="artifact-canvas-type-badge"
                    className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
                  >
                    {labels.typeLabel(artifact.type)}
                  </span>
                  <h3 className="font-semibold text-base">{artifact.title}</h3>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

MosaicArtifactCanvasAdapter.displayName = "MosaicArtifactCanvasAdapter";
