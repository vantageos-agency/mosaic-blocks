/**
 * MosaicDocumentUpload — presentational document drop-zone + file status list
 *
 * Presentational atom. Renders a drag&drop / click-to-browse zone and, below
 * it, one status row per file (uploading / success / error). The component
 * never performs a network call: file selection (drop or file-input change)
 * is surfaced via `onFilesSelected(files: File[])` — the host owns where the
 * upload goes, how progress is tracked, and how errors are produced. `files`
 * is fully host-controlled state (id, name, sizeBytes, status, optional
 * progress / errorMessage).
 *
 * Pattern: MosaicStepPipeline.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --foreground, --muted, --muted-foreground, --border,
 * --destructive, --ring, --accent, --card, --background.
 * No icon library — uses ✓ / ✕ chars for success/error, matching the
 * step-pipeline convention (no lucide-react runtime dependency).
 * a11y: drop-zone is a labelled, keyboard-reachable button; file rows use
 * role="status" region semantics; remove buttons have a required per-file
 * accessible name.
 * Bilingual: every user-facing string (idle/drag/browse/accept-hint/status
 * labels/remove label/error message) is a required caller-supplied prop —
 * zero hardcoded copy, zero default.
 *
 * Ported from any-debate-ai components/memory/document-upload.tsx (rewritten
 * from scratch — no shared code, no license carried over): dropped the
 * embedded mock "extracted memories" review UI (app-specific business logic)
 * and the network/simulation logic (violates presentational-component rule),
 * kept the upload zone + per-file status list shape.
 *
 * @example
 * <MosaicDocumentUpload
 *   files={files}
 *   onFilesSelected={(selected) => uploadFiles(selected)}
 *   onRemoveFile={(id) => removeFile(id)}
 *   idleLabel="Glissez-déposez un fichier ici, ou cliquez pour parcourir"
 *   dragActiveLabel="Déposez le fichier ici"
 *   browseButtonLabel="Choisir un fichier"
 *   acceptHint="PDF, DOC, DOCX, TXT, MD (10 Mo max)"
 *   accept=".pdf,.doc,.docx,.txt,.md"
 *   removeFileAriaLabel={(name) => `Supprimer ${name}`}
 *   statusLabels={{ uploading: "Envoi en cours", success: "Envoyé", error: "Échec" }}
 *   sizeLabel={(bytes) => `${(bytes / 1024).toFixed(1)} Ko`}
 *   dropZoneAriaLabel="Zone de dépôt de document"
 * />
 */

import type * as React from "react";
import { useId, useRef, useState } from "react";
import {
  documentUploadDropZoneVariants,
  documentUploadFileRowVariants,
  documentUploadProgressFillVariants,
  documentUploadProgressTrackVariants,
  documentUploadStatusLabelVariants,
} from "./document-upload-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicDocumentUploadFileStatus = "uploading" | "success" | "error";

export interface MosaicDocumentUploadFile {
  /** Stable id — used as React key and passed back to onRemoveFile. */
  id: string;
  /** File name, displayed as-is. */
  name: string;
  /** File size in bytes — formatted for display via the required sizeLabel prop. */
  sizeBytes: number;
  /** Current upload status, fully host-controlled. */
  status: MosaicDocumentUploadFileStatus;
  /** Upload progress 0-100, rendered only while status === "uploading". */
  progress?: number;
  /**
   * Host-provided, host-localized error message (e.g. "File too large",
   * "Unsupported format"). Required content when status === "error" — the
   * library never generates its own error strings.
   */
  errorMessage?: string;
}

export interface MosaicDocumentUploadProps {
  /** Host-controlled list of files with their upload status. */
  files: MosaicDocumentUploadFile[];
  /**
   * Called with the raw browser `File[]` chosen via drag&drop or the file
   * picker. The component performs no upload itself — the host decides
   * where the files go and how `files` state is updated afterward.
   */
  onFilesSelected: (files: File[]) => void;
  /** Called with a file's id when its remove button is activated. */
  onRemoveFile: (id: string) => void;
  /** Drop-zone label shown when idle (not dragging). Required, no default. */
  idleLabel: string;
  /** Drop-zone label shown while a drag is over the zone. Required, no default. */
  dragActiveLabel: string;
  /** Label for the click-to-browse button. Required, no default. */
  browseButtonLabel: string;
  /** Supporting hint text (accepted formats / size limit). Required, no default. */
  acceptHint: string;
  /** Accessible name for the drop-zone region (`aria-label`). Required, no default. */
  dropZoneAriaLabel: string;
  /**
   * Per-file accessible name for the remove button, e.g.
   * `(name) => \`Remove ${name}\``. Required — no hardcoded "Remove" string
   * in the library.
   */
  removeFileAriaLabel: (fileName: string) => string;
  /** Status labels rendered next to each file row. All three required, no default. */
  statusLabels: {
    uploading: string;
    success: string;
    error: string;
  };
  /**
   * Formats a file's size for display, e.g. `(bytes) => \`${(bytes/1024).toFixed(1)} KB\``.
   * Required — the library never hardcodes a unit string ("KB", "Ko", ...).
   */
  sizeLabel: (sizeBytes: number) => string;
  /** Native `accept` attribute forwarded to the hidden file input. */
  accept?: string;
  /** Allow selecting/dropping more than one file at a time. @default false */
  multiple?: boolean;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicDocumentUpload — production document-upload atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders the drop-zone and the file status list from
 * props, and reports file selection / removal via callbacks. No network
 * call, no upload simulation, no built-in copy.
 */
export function MosaicDocumentUpload({
  files,
  onFilesSelected,
  onRemoveFile,
  idleLabel,
  dragActiveLabel,
  browseButtonLabel,
  acceptHint,
  dropZoneAriaLabel,
  removeFileAriaLabel,
  statusLabels,
  sizeLabel,
  accept,
  multiple = false,
  className,
  ref,
}: MosaicDocumentUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length > 0) onFilesSelected(dropped);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length > 0) onFilesSelected(selected);
    // Reset so selecting the same file again still fires a change event.
    event.target.value = "";
  }

  return (
    <div ref={ref} data-slot="document-upload" className={cn("flex flex-col gap-4", className)}>
      <div
        data-slot="document-upload-drop-zone"
        aria-label={dropZoneAriaLabel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={documentUploadDropZoneVariants({ dragActive: isDragActive })}
      >
        <p data-slot="document-upload-idle-label" className="text-sm font-medium">
          {isDragActive ? dragActiveLabel : idleLabel}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
        <label htmlFor={inputId}>
          <span
            data-slot="document-upload-browse-button"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium hover:bg-accent/50 transition-colors"
          >
            {browseButtonLabel}
          </span>
        </label>
        <p data-slot="document-upload-accept-hint" className="text-xs text-muted-foreground">
          {acceptHint}
        </p>
      </div>

      {files.length > 0 && (
        <ul data-slot="document-upload-file-list" className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              data-slot="document-upload-file-row"
              data-status={file.status}
              className={documentUploadFileRowVariants({ status: file.status })}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p data-slot="document-upload-file-name" className="text-sm font-medium truncate">
                    {file.name}
                  </p>
                  <span
                    data-slot="document-upload-status-label"
                    className={documentUploadStatusLabelVariants({ status: file.status })}
                  >
                    {statusLabels[file.status]}
                  </span>
                </div>
                <p data-slot="document-upload-file-size" className="text-xs text-muted-foreground">
                  {sizeLabel(file.sizeBytes)}
                </p>

                {file.status === "uploading" && (
                  <div
                    data-slot="document-upload-progress-track"
                    role="progressbar"
                    // Non-interactive status indicator: not a tab stop, but still
                    // programmatically focusable to satisfy a11y/useFocusableInteractive.
                    tabIndex={-1}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={file.progress ?? 0}
                    className={cn(documentUploadProgressTrackVariants(), "mt-2")}
                  >
                    <div
                      data-slot="document-upload-progress-fill"
                      className={documentUploadProgressFillVariants()}
                      style={{ width: `${file.progress ?? 0}%` }}
                    />
                  </div>
                )}

                {file.status === "error" && file.errorMessage !== undefined && (
                  <p
                    data-slot="document-upload-error-message"
                    className="mt-1 text-xs text-destructive"
                  >
                    {file.errorMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                data-slot="document-upload-remove-button"
                aria-label={removeFileAriaLabel(file.name)}
                onClick={() => onRemoveFile(file.id)}
                className="shrink-0 inline-flex min-h-9 min-w-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
              >
                {file.status === "success" ? "✓" : "✕"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

MosaicDocumentUpload.displayName = "MosaicDocumentUpload";
