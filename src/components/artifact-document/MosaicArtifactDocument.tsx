/**
 * MosaicArtifactDocument — dumb, contract-agnostic document artifact renderer
 *
 * Renders a normalized document artifact payload. Owns no knowledge of its
 * runtime source (@ai-sdk-tools/artifacts vs the MCP Apps ui:// bridge) —
 * it consumes the same `data` shape either source normalizes to, one level
 * below `NormalizedArtifact["data"]` in `artifact-canvas-adapter`.
 *
 * Read-only presentation. Ported from any-debate-ai's DocumentArtifact,
 * stripped of editing state (inline edit mode, autosave, markdown toolbar)
 * to keep this a pure render component, per the C1 adapter contract.
 *
 * data-slot="artifact-document" on the root, "artifact-document-section"
 * per section, "artifact-document-tag" per tag.
 *
 * i18n: zero hardcoded user-facing strings — every label is a required
 * prop (mosaic-blocks doctrine, see src/__tests__/i18n-no-hardcoded-literals.test.ts).
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Data shape ────────────────────────────────────────────────────────────────

export interface MosaicArtifactDocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface MosaicArtifactDocumentData {
  title: string;
  content: string;
  sections?: MosaicArtifactDocumentSection[];
  metadata?: {
    updatedAt?: string;
    tags?: string[];
  };
}

export interface MosaicArtifactDocumentLabels {
  /** Accessible text for the "Document" type badge. */
  typeBadgeLabel: string;
  /** Heading above the sections list. */
  sectionsHeading: string;
  /** Prefix label shown before the tags list. */
  tagsLabel: string;
  /** Formats the last-updated line, e.g. (date) => `Updated ${date}`. */
  updatedLabel: (formattedDate: string) => string;
  /** Shown in place of the content when it is blank. */
  emptyContentMessage: string;
  /** Formats a section's character count, e.g. (n) => `${n} chars`. */
  charsLabel: (count: number) => string;
}

export interface MosaicArtifactDocumentProps {
  data: MosaicArtifactDocumentData;
  labels: MosaicArtifactDocumentLabels;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicArtifactDocument — read-only document artifact renderer.
 *
 * @example
 * <MosaicArtifactDocument
 *   data={{ title: "Launch plan", content: "..." }}
 *   labels={{
 *     typeBadgeLabel: "Document",
 *     sectionsHeading: "Sections",
 *     tagsLabel: "Tags:",
 *     updatedLabel: (d) => `Updated ${d}`,
 *     emptyContentMessage: "This document is empty.",
 *     charsLabel: (n) => `${n} chars`,
 *   }}
 * />
 */
export function MosaicArtifactDocument({
  data,
  labels,
  className,
  ref,
}: MosaicArtifactDocumentProps) {
  const sortedSections = data.sections ? [...data.sections].sort((a, b) => a.order - b.order) : [];

  return (
    <div
      ref={ref}
      data-slot="artifact-document"
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-border border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h3 className="truncate font-medium text-base">{data.title}</h3>
          <span
            data-slot="artifact-document-type-badge"
            className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
          >
            {labels.typeBadgeLabel}
          </span>
        </div>
        {data.metadata?.updatedAt && (
          <span className="shrink-0 text-muted-foreground text-xs">
            {labels.updatedLabel(new Date(data.metadata.updatedAt).toLocaleDateString())}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {data.content || labels.emptyContentMessage}
        </div>
      </div>

      {sortedSections.length > 0 && (
        <div className="border-border border-t p-4">
          <h4 className="mb-3 font-medium text-sm">{labels.sectionsHeading}</h4>
          <ul className="space-y-2">
            {sortedSections.map((section) => (
              <li
                key={section.id}
                data-slot="artifact-document-section"
                className="flex items-center gap-2 rounded bg-muted/50 p-2"
              >
                <span className="h-4 w-1 shrink-0 rounded-full bg-primary" />
                <span className="font-medium text-sm">{section.title}</span>
                <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
                  {labels.charsLabel(section.content.length)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.metadata?.tags && data.metadata.tags.length > 0 && (
        <div className="border-border border-t p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">{labels.tagsLabel}</span>
            {data.metadata.tags.map((tag) => (
              <span
                key={tag}
                data-slot="artifact-document-tag"
                className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

MosaicArtifactDocument.displayName = "MosaicArtifactDocument";
