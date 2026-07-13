"use client";

/**
 * MosaicTemplateManagementPanel — manage a host-supplied list of saved
 * agent templates: rename, duplicate, delete.
 *
 * Presentational + interaction-owning atom. The template DATA (id, name)
 * belongs entirely to the host — this component never fetches, filters, or
 * invents a template. All three mutating actions (rename / duplicate /
 * delete) are callbacks up: the host decides what happens next (persist,
 * confirm, optimistic-update, etc.). Duplicate and Delete fire immediately
 * on selection — pairing Delete with a confirmation step (e.g.
 * MosaicDeleteConfirmationDialog) is a host-composition concern, not
 * something this panel assumes.
 *
 * Rename is the one action with local interaction state: selecting "Rename"
 * switches that row into an edit mode (a controlled text input pre-filled
 * with the current name) with Save/Cancel. Save calls
 * `onRename(id, trimmedValue)`; Cancel discards the local edit and
 * calls nothing.
 *
 * Every user-facing string is a required prop with no default — this
 * library carries zero words (SIN-01), bilingual FR+EN by design.
 * `actionsAriaLabelFor` is a required function prop so the host can compose
 * a localized "Actions for {name}" string per row without the component
 * ever concatenating language itself.
 *
 * data-slot="template-management-panel" on the root, data-slot=
 * "template-management-row" on each row (scopes row-local queries and keeps
 * per-row menus from resolving by name collision when two templates share a
 * name).
 *
 * Deps: @base-ui/react (via MosaicButton, MosaicInput, MosaicDropdownMenu) +
 * class-variance-authority only.
 */

import * as React from "react";
import { MosaicButton } from "../button/Button.js";
import { MosaicDropdownMenu } from "../dropdown-menu/MosaicDropdownMenu.js";
import type { MosaicDropdownMenuItem } from "../dropdown-menu/MosaicDropdownMenu.js";
import { MosaicInput } from "../input/MosaicInput.js";
import { templateManagementRowVariants } from "./template-management-panel-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicTemplateManagementItem {
  /** Stable identifier, forwarded verbatim to every callback. */
  id: string;
  /** Host-owned template name — pure data, never invented by this component. */
  name: string;
}

export interface MosaicTemplateManagementPanelProps {
  /** Host-supplied templates. Pure data — never fetched or filtered here. */
  templates: MosaicTemplateManagementItem[];
  /** Panel heading. Required, no default. */
  heading: string;
  /** Message shown when `templates` is empty. Required, no default. */
  emptyMessage: string;
  /** Row action-menu item label for the rename action. Required, no default. */
  renameLabel: string;
  /** Row action-menu item label for the duplicate action. Required, no default. */
  duplicateLabel: string;
  /** Row action-menu item label for the delete action. Required, no default. */
  deleteLabel: string;
  /** Label for the confirm button while a row is in rename mode. Required, no default. */
  saveLabel: string;
  /** Label for the discard button while a row is in rename mode. Required, no default. */
  cancelLabel: string;
  /** aria-label for the rename text input. Required, no default. */
  renameInputAriaLabel: string;
  /**
   * Derives the aria-label for a row's action-menu trigger from that row's
   * current name (e.g. `(name) => \`Actions for ${name}\``). Required — the
   * host owns the language, this component never concatenates copy itself.
   */
  actionsAriaLabelFor: (name: string) => string;
  /** Called with (id, trimmedNewName) when a rename is saved. */
  onRename: (id: string, newName: string) => void;
  /** Called with the template id when Duplicate is selected. */
  onDuplicate: (id: string) => void;
  /** Called with the template id when Delete is selected. */
  onDelete: (id: string) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTemplateManagementPanel — production template-management panel for
 * @vantageos/mosaic-blocks.
 *
 * @example
 * <MosaicTemplateManagementPanel
 *   templates={templates}
 *   heading="Saved templates"
 *   emptyMessage="No saved templates yet."
 *   renameLabel="Rename" duplicateLabel="Duplicate" deleteLabel="Delete"
 *   saveLabel="Save" cancelLabel="Cancel"
 *   renameInputAriaLabel="Template name"
 *   actionsAriaLabelFor={(name) => `Actions for ${name}`}
 *   onRename={(id, name) => renameTemplate(id, name)}
 *   onDuplicate={(id) => duplicateTemplate(id)}
 *   onDelete={(id) => deleteTemplate(id)}
 * />
 */
export function MosaicTemplateManagementPanel({
  templates,
  heading,
  emptyMessage,
  renameLabel,
  duplicateLabel,
  deleteLabel,
  saveLabel,
  cancelLabel,
  renameInputAriaLabel,
  actionsAriaLabelFor,
  onRename,
  onDuplicate,
  onDelete,
  className,
}: MosaicTemplateManagementPanelProps) {
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState("");

  const startRename = (item: MosaicTemplateManagementItem) => {
    setRenamingId(item.id);
    setDraftName(item.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setDraftName("");
  };

  const saveRename = (id: string) => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      onRename(id, trimmed);
    }
    setRenamingId(null);
    setDraftName("");
  };

  const menuItems: MosaicDropdownMenuItem[] = [
    { id: "rename", label: renameLabel },
    { id: "duplicate", label: duplicateLabel },
    { id: "delete", label: deleteLabel, separator: true },
  ];

  const handleItemSelect = (item: MosaicTemplateManagementItem, actionId: string) => {
    if (actionId === "rename") {
      startRename(item);
    } else if (actionId === "duplicate") {
      onDuplicate(item.id);
    } else if (actionId === "delete") {
      onDelete(item.id);
    }
  };

  return (
    <div
      data-slot="template-management-panel"
      className={cn("flex flex-col rounded-lg border border-border bg-background", className)}
    >
      <h2 className="border-b border-border px-4 py-3 font-semibold text-foreground text-sm">
        {heading}
      </h2>

      {templates.length === 0 ? (
        <p className="px-4 py-6 text-center text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <ul>
          {templates.map((item) => {
            const isRenaming = renamingId === item.id;
            return (
              <li
                key={item.id}
                data-slot="template-management-row"
                className={templateManagementRowVariants()}
              >
                {isRenaming ? (
                  <div className="flex flex-1 items-center gap-2">
                    <MosaicInput
                      aria-label={renameInputAriaLabel}
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="flex-1"
                    />
                    <MosaicButton type="button" size="sm" onClick={() => saveRename(item.id)}>
                      {saveLabel}
                    </MosaicButton>
                    <MosaicButton type="button" variant="outline" size="sm" onClick={cancelRename}>
                      {cancelLabel}
                    </MosaicButton>
                  </div>
                ) : (
                  <>
                    <span className="truncate text-foreground text-sm">{item.name}</span>
                    <MosaicDropdownMenu
                      trigger={
                        <button
                          type="button"
                          aria-label={actionsAriaLabelFor(item.name)}
                          className={cn(
                            "flex size-8 items-center justify-center rounded-md",
                            "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <DotsIcon />
                        </button>
                      }
                      items={menuItems}
                      onItemSelect={(actionId) => handleItemSelect(item, actionId)}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

MosaicTemplateManagementPanel.displayName = "MosaicTemplateManagementPanel";

// ── Inline icon ───────────────────────────────────────────────────────────────

function DotsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}
