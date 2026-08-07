"use client";

/**
 * MosaicArtifactVersionHistory — org-scoped version-history timeline for a
 * deliverable, letting the user select a version to open through the C1
 * adapter + C2 renderers, and (optionally) restore an earlier version.
 *
 * Reuse: ported from any-debate-ai —
 * components/artifacts/version-history/VersionHistoryPanel.tsx — stripped
 * of its `AdaptiveModal` chrome, `versionHistoryManager` in-memory store,
 * search/filter/diff/export UI, framer-motion, sonner, and shadcn/ui deps.
 * The panel here is a pure, prop-driven timeline: the host supplies the
 * already-fetched/filtered version list plus select/restore handlers — no
 * backend, no hardcoded org data. Diffing, comparison, search, and export
 * are host concerns kept out of this component's contract, same as the C3
 * library kept folders/tags/bulk-actions out of its own.
 *
 * data-slot="artifact-version-history" on the root,
 * "artifact-version-history-list" on the version list,
 * "artifact-version-history-item" per version.
 *
 * i18n: zero hardcoded user-facing strings (mosaic-blocks doctrine — see
 * src/__tests__/i18n-no-hardcoded-literals.test.ts). Every label is a
 * required prop; the host owns the language.
 */

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicArtifactVersionHistoryVersion {
  id: string;
  /** Host-formatted version marker, e.g. "v3". */
  versionLabel: string;
  /** Host-formatted author name. */
  authorLabel: string;
  /** Host-formatted relative/absolute timestamp, e.g. "2 days ago". */
  timestampLabel: string;
  /** Host-formatted change-type badge text, e.g. "Edited". */
  changeTypeLabel: string;
  /** Optional host-formatted change description/commit message. */
  descriptionLabel?: string;
  /** True for the version that is currently live — hides the restore action. */
  isCurrent: boolean;
}

export interface MosaicArtifactVersionHistoryBaseProps {
  /** Versions to render, host-ordered (newest-first is the caller's choice). */
  versions: MosaicArtifactVersionHistoryVersion[];
  selectedId: string | null;
  onSelectVersion: (id: string) => void;
  /** Section heading. Required, no default. */
  title: string;
  /** Message shown when there are no versions. Required, no default. */
  emptyMessage: string;
  /** Badge text for the current/latest version. Required, no default. */
  currentLabel: string;
  /** Accessible name for a version's select button. Required, no default. */
  selectAriaLabel: (version: MosaicArtifactVersionHistoryVersion) => string;
  className?: string;
}

/**
 * Discriminated union on `onRestoreVersion` — the restore control only ever
 * renders on the branch where a restore handler is supplied, so its label +
 * accessible-name formatter are required EXACTLY there, never on the
 * read-only branch. Requiring them unconditionally would force every
 * read-only host to supply values the component never displays (the "lying
 * prop contract" this retrofit closes — see the `no-lying-prop-contract`
 * guard and the `MosaicMemoryCardVariantProps` precedent in
 * `memory-card/MosaicMemoryCard.tsx`).
 */
export type MosaicArtifactVersionHistoryRestoreProps =
  | {
      /** Restores a version. */
      onRestoreVersion: (id: string) => void;
      /** Restore button visible text. Required — the control renders whenever `onRestoreVersion` is provided. */
      restoreLabel: string;
      /**
       * Accessible name for a version's restore button, DISTINCT per
       * version — a bare icon/shared label is never a substitute for an
       * accessible name distinguishing which version is restored (see the
       * C3 library's searchAriaLabel lesson). Required — the control
       * renders whenever `onRestoreVersion` is provided.
       */
      restoreAriaLabel: (version: MosaicArtifactVersionHistoryVersion) => string;
    }
  | {
      /** Omit to render a read-only history — no restore control at all. */
      onRestoreVersion?: undefined;
    };

export type MosaicArtifactVersionHistoryProps = MosaicArtifactVersionHistoryBaseProps &
  MosaicArtifactVersionHistoryRestoreProps;

export function MosaicArtifactVersionHistory(props: MosaicArtifactVersionHistoryProps) {
  const {
    versions,
    selectedId,
    onSelectVersion,
    title,
    emptyMessage,
    currentLabel,
    selectAriaLabel,
    className,
  } = props;
  return (
    <div data-slot="artifact-version-history" className={cn("flex h-full flex-col", className)}>
      <div className="border-border border-b px-4 py-3">
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 && (
          <p className="py-10 text-center text-muted-foreground text-sm">{emptyMessage}</p>
        )}

        <ul data-slot="artifact-version-history-list" className="space-y-2">
          {versions.map((version) => (
            <li key={version.id} data-slot="artifact-version-history-item">
              <div
                className={cn(
                  "flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2",
                  selectedId === version.id && "border-primary bg-primary/5",
                )}
              >
                <button
                  type="button"
                  aria-current={selectedId === version.id ? "true" : undefined}
                  onClick={() => onSelectVersion(version.id)}
                  className={cn(
                    "min-w-0 flex-1 text-left",
                    "outline-none transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring",
                  )}
                  aria-label={selectAriaLabel(version)}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                      {version.versionLabel}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs">
                      {version.changeTypeLabel}
                    </span>
                    {version.isCurrent && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                        {currentLabel}
                      </span>
                    )}
                  </div>

                  {version.descriptionLabel && (
                    <p className="mb-1 truncate font-medium text-sm">{version.descriptionLabel}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                    <span>{version.authorLabel}</span>
                    <span>{version.timestampLabel}</span>
                  </div>
                </button>

                {props.onRestoreVersion && !version.isCurrent && (
                  <button
                    type="button"
                    onClick={() => props.onRestoreVersion?.(version.id)}
                    className={cn(
                      "shrink-0 rounded-md border border-input px-2 py-1 text-xs",
                      "outline-none transition-colors hover:bg-muted",
                      "focus-visible:ring-[3px] focus-visible:ring-ring",
                    )}
                    aria-label={props.restoreAriaLabel(version)}
                  >
                    {props.restoreLabel}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

MosaicArtifactVersionHistory.displayName = "MosaicArtifactVersionHistory";
