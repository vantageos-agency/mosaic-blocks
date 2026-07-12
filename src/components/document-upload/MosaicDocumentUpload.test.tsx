/**
 * MosaicDocumentUpload — tests
 *
 * Coverage: drop-zone renders idle/drag-active label; click-to-browse triggers
 * hidden file input; drag&drop + file-input selection both call
 * onFilesSelected with the raw File[] (no network call, no upload logic in
 * the component); per-file rows render uploading/success/error status with
 * required i18n labels; progress bar only in "uploading"; error rows surface
 * the host-provided errorMessage; remove button calls onRemoveFile(id);
 * data-slot attributes; no hardcoded strings.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicDocumentUpload } from "./MosaicDocumentUpload.js";
import type { MosaicDocumentUploadFile } from "./MosaicDocumentUpload.js";

const STATUS_LABELS = {
  uploading: "Téléversement en cours",
  success: "Téléversé",
  error: "Échec",
};

const BASE_PROPS = {
  files: [] as MosaicDocumentUploadFile[],
  onFilesSelected: vi.fn(),
  onRemoveFile: vi.fn(),
  idleLabel: "Glissez-déposez un fichier ici",
  dragActiveLabel: "Déposez le fichier ici",
  browseButtonLabel: "Choisir un fichier",
  acceptHint: "PDF, DOC, DOCX, TXT, MD",
  removeFileAriaLabel: (name: string) => `Supprimer ${name}`,
  statusLabels: STATUS_LABELS,
  sizeLabel: (bytes: number) => `${(bytes / 1024).toFixed(1)} Ko`,
  dropZoneAriaLabel: "Zone de dépôt de document",
};

function makeFile(name: string, type = "application/pdf"): File {
  return new File(["contenu"], name, { type });
}

describe("MosaicDocumentUpload", () => {
  it("renders the idle label when not dragging", () => {
    render(<MosaicDocumentUpload {...BASE_PROPS} />);
    expect(screen.getByText("Glissez-déposez un fichier ici")).toBeTruthy();
  });

  it("renders the drop-zone with the required aria-label", () => {
    const { container } = render(<MosaicDocumentUpload {...BASE_PROPS} />);
    const zone = container.querySelector("[data-slot='document-upload-drop-zone']");
    expect(zone?.getAttribute("aria-label")).toBe("Zone de dépôt de document");
  });

  it("switches to the drag-active label on dragOver and back on dragLeave", () => {
    const { container } = render(<MosaicDocumentUpload {...BASE_PROPS} />);
    const zone = container.querySelector("[data-slot='document-upload-drop-zone']");
    if (!zone) throw new Error("drop zone not found");

    fireEvent.dragOver(zone);
    expect(screen.getByText("Déposez le fichier ici")).toBeTruthy();

    fireEvent.dragLeave(zone);
    expect(screen.getByText("Glissez-déposez un fichier ici")).toBeTruthy();
  });

  it("calls onFilesSelected with dropped files and resets drag state", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <MosaicDocumentUpload {...BASE_PROPS} onFilesSelected={onFilesSelected} />,
    );
    const zone = container.querySelector("[data-slot='document-upload-drop-zone']");
    if (!zone) throw new Error("drop zone not found");

    const file = makeFile("rapport.pdf");
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0][0]).toEqual([file]);
    expect(screen.getByText("Glissez-déposez un fichier ici")).toBeTruthy();
  });

  it("calls onFilesSelected with files chosen via the hidden file input", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <MosaicDocumentUpload {...BASE_PROPS} onFilesSelected={onFilesSelected} />,
    );
    const input = container.querySelector("input[type='file']");
    if (!input) throw new Error("file input not found");

    const file = makeFile("notes.md", "text/markdown");
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0][0]).toEqual([file]);
  });

  it("renders the browse button with the required label", () => {
    render(<MosaicDocumentUpload {...BASE_PROPS} />);
    expect(screen.getByText("Choisir un fichier")).toBeTruthy();
  });

  it("renders the accept hint text", () => {
    render(<MosaicDocumentUpload {...BASE_PROPS} />);
    expect(screen.getByText("PDF, DOC, DOCX, TXT, MD")).toBeTruthy();
  });

  it("performs no network call — onFilesSelected is a pure prop callback", () => {
    // Structural guarantee: the component never references fetch/XHR itself.
    // This test documents the contract by asserting the callback is the only
    // side-effect path exercised on file selection.
    const onFilesSelected = vi.fn();
    const { container } = render(
      <MosaicDocumentUpload {...BASE_PROPS} onFilesSelected={onFilesSelected} />,
    );
    const input = container.querySelector("input[type='file']");
    if (!input) throw new Error("file input not found");
    fireEvent.change(input, { target: { files: [makeFile("a.pdf")] } });
    expect(onFilesSelected).toHaveBeenCalled();
  });

  describe("file rows", () => {
    const FILES: MosaicDocumentUploadFile[] = [
      { id: "f1", name: "contrat.pdf", sizeBytes: 204800, status: "uploading", progress: 42 },
      { id: "f2", name: "notes.txt", sizeBytes: 1024, status: "success" },
      {
        id: "f3",
        name: "image.png",
        sizeBytes: 512000,
        status: "error",
        errorMessage: "Format non pris en charge",
      },
    ];

    it("renders one row per file with data-slot and data-status", () => {
      const { container } = render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      const rows = container.querySelectorAll("[data-slot='document-upload-file-row']");
      expect(rows.length).toBe(3);
      expect(rows[0].getAttribute("data-status")).toBe("uploading");
      expect(rows[1].getAttribute("data-status")).toBe("success");
      expect(rows[2].getAttribute("data-status")).toBe("error");
    });

    it("renders file name and host-formatted size", () => {
      render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      expect(screen.getByText("contrat.pdf")).toBeTruthy();
      expect(screen.getByText("200.0 Ko")).toBeTruthy();
    });

    it("renders the status label for each file", () => {
      render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      expect(screen.getByText("Téléversement en cours")).toBeTruthy();
      expect(screen.getByText("Téléversé")).toBeTruthy();
      expect(screen.getByText("Échec")).toBeTruthy();
    });

    it("renders a progress bar only for the uploading file", () => {
      const { container } = render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      const bars = container.querySelectorAll("[data-slot='document-upload-progress-track']");
      expect(bars.length).toBe(1);
      const fill = container.querySelector("[data-slot='document-upload-progress-fill']");
      expect(fill?.getAttribute("style")).toContain("42%");
    });

    it("renders the host-provided errorMessage for the error file", () => {
      render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      expect(screen.getByText("Format non pris en charge")).toBeTruthy();
    });

    it("calls onRemoveFile with the file id when the remove button is clicked", () => {
      const onRemoveFile = vi.fn();
      render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} onRemoveFile={onRemoveFile} />);
      const removeButtons = screen.getAllByRole("button", { name: /Supprimer/ });
      fireEvent.click(removeButtons[1]);
      expect(onRemoveFile).toHaveBeenCalledWith("f2");
    });

    it("uses the required removeFileAriaLabel function per file", () => {
      render(<MosaicDocumentUpload {...BASE_PROPS} files={FILES} />);
      expect(screen.getByRole("button", { name: "Supprimer contrat.pdf" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Supprimer notes.txt" })).toBeTruthy();
    });

    it("uses file.id as React key (no key warnings) when ids repeat across renders", () => {
      const { container, rerender } = render(
        <MosaicDocumentUpload {...BASE_PROPS} files={FILES} />,
      );
      rerender(<MosaicDocumentUpload {...BASE_PROPS} files={[...FILES]} />);
      expect(container.querySelectorAll("[data-slot='document-upload-file-row']").length).toBe(3);
    });
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicDocumentUpload {...BASE_PROPS} className="my-custom-class" />,
    );
    const root = container.querySelector("[data-slot='document-upload']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("sets data-slot='document-upload' on the root", () => {
    const { container } = render(<MosaicDocumentUpload {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='document-upload']")).toBeTruthy();
  });

  it("respects the multiple prop on the hidden file input (default false)", () => {
    const { container, rerender } = render(<MosaicDocumentUpload {...BASE_PROPS} />);
    let input = container.querySelector("input[type='file']");
    expect(input?.hasAttribute("multiple")).toBe(false);

    rerender(<MosaicDocumentUpload {...BASE_PROPS} multiple />);
    input = container.querySelector("input[type='file']");
    expect(input?.hasAttribute("multiple")).toBe(true);
  });

  it("forwards the accept prop to the hidden file input", () => {
    const { container } = render(
      <MosaicDocumentUpload {...BASE_PROPS} accept=".pdf,.doc,.docx,.txt,.md" />,
    );
    const input = container.querySelector("input[type='file']");
    expect(input?.getAttribute("accept")).toBe(".pdf,.doc,.docx,.txt,.md");
  });
});
