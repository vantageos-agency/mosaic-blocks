"use client";

/**
 * MosaicModuleLibrary — generic module/framework/persona/role library (responsive-pair)
 *
 * Ported from components/module-libraries/ (FrameworkLibrary, PersonaLibrary,
 *   RoleLibrary + desktop/mobile variants + forms + editor modals)
 * Combined into a single generic pattern.
 *
 * "Module" = any reusable item in a library (framework, persona, role, skill, etc.)
 * Labels and field configs are fully prop-driven.
 *
 * Exports:
 *   MosaicModuleLibrary    — responsive orchestrator
 *   MosaicModuleForm       — create/edit form for a module
 *
 * All domain-specific hooks (useFrameworkManager) stripped.
 * Data + CRUD callbacks are props.
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicModuleItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  tags?: string[];
  /** Steps or methodology items */
  steps?: string[];
  /** Best-for use cases */
  bestFor?: string[];
  /** Whether this item was created by the user (editable/deletable) */
  isCustom?: boolean;
  [key: string]: unknown;
}

export interface MosaicModuleFormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "emoji" | "tag-list";
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export interface MosaicModuleLibraryProps {
  /** All items in the library (system + custom) */
  items: MosaicModuleItem[];
  /** Whether items are loading */
  isLoading?: boolean;
  onCreateItem: (data: Omit<MosaicModuleItem, "id">) => void;
  onUpdateItem: (id: string, data: Partial<MosaicModuleItem>) => void;
  onDeleteItem: (id: string) => void;
  /** Tabs to switch between (e.g. "My Modules" vs "System") */
  tabs?: Array<{ id: string; label: string }>;
  /** Filter function for each tab */
  tabFilter?: (item: MosaicModuleItem, tabId: string) => boolean;
  /** Additional form fields beyond name/description */
  formFields?: MosaicModuleFormField[];
  /** Library heading. Required, no default. */
  title: string;
  /** Label for the "create item" button. Required, no default. */
  createLabel: string;
  /** Search input placeholder. Required, no default. */
  searchPlaceholder: string;
  /** Message shown when the filtered list is empty. Required, no default. */
  emptyMessage: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  nameFieldLabel: string;
  descriptionFieldLabel: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  cancelLabel: string;
  saveChangesLabel: string;
  createItemLabel: string;
  itemActionsAriaLabel: string;
  editItemLabel: string;
  deleteItemLabel: string;
  closeEditorAriaLabel: string;
  /** Modal title for the editor. Required — `(itemName) => string`. */
  editModalTitle: (itemName: string) => string;
  /**
   * Placeholder for the "add a tag" input in `tag-list` fields (used only
   * when the field itself doesn't set its own `placeholder`). Required,
   * no default.
   */
  tagListAddPlaceholder: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MoreVertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── MosaicModuleForm ──────────────────────────────────────────────────────────

/** Props shared by both form modes — read unconditionally. */
export interface MosaicModuleFormBaseProps {
  item?: MosaicModuleItem;
  formFields?: MosaicModuleFormField[];
  onSave: (data: Omit<MosaicModuleItem, "id"> | MosaicModuleItem) => void;
  onCancel: () => void;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  nameFieldLabel: string;
  descriptionFieldLabel: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  cancelLabel: string;
  /**
   * Placeholder for the "add a tag" input in `tag-list` fields (used only
   * when the field itself doesn't set its own `placeholder`). Required,
   * no default.
   */
  tagListAddPlaceholder: string;
}

/**
 * Discriminated union on `mode`. The submit button renders EXACTLY ONE label:
 * `createItemLabel` in "create", `saveChangesLabel` in "edit". Requiring both
 * in both modes forced every host to supply a string the form never displays —
 * a "lying prop contract", found by the `no-lying-prop-contract` guard (the
 * same defect class as MosaicMemoryCard's `formatMoreTags`). Each label now
 * lives on the branch that actually renders it.
 */
export type MosaicModuleFormModeProps =
  | {
      mode: "create";
      /** Submit-button label in create mode. Required here — not in "edit". */
      createItemLabel: string;
    }
  | {
      mode: "edit";
      /** Submit-button label in edit mode. Required here — not in "create". */
      saveChangesLabel: string;
    };

export type MosaicModuleFormProps = MosaicModuleFormBaseProps & MosaicModuleFormModeProps;

export function MosaicModuleForm(props: MosaicModuleFormProps) {
  const {
    item,
    mode,
    formFields = [],
    onSave,
    onCancel,
    nameFieldLabel,
    descriptionFieldLabel,
    namePlaceholder,
    descriptionPlaceholder,
    cancelLabel,
    tagListAddPlaceholder,
  } = props;
  const [formData, setFormData] = React.useState<Partial<MosaicModuleItem>>({
    name: item?.name ?? "",
    description: item?.description ?? "",
    icon: item?.icon ?? "",
    tags: item?.tags ?? [],
    steps: item?.steps ?? [],
    bestFor: item?.bestFor ?? [],
    ...Object.fromEntries(
      formFields.map((f) => [f.id, item?.[f.id] ?? (f.type === "tag-list" ? [] : "")]),
    ),
  });

  const [tagInputs, setTagInputs] = React.useState<Record<string, string>>({});

  const update = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = (fieldId: string) => {
    const val = tagInputs[fieldId]?.trim();
    if (!val) return;
    const existing = (formData[fieldId] as string[]) ?? [];
    if (!existing.includes(val)) {
      update(fieldId, [...existing, val]);
    }
    setTagInputs((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const removeTag = (fieldId: string, tag: string) => {
    update(
      fieldId,
      ((formData[fieldId] as string[]) ?? []).filter((t) => t !== tag),
    );
  };

  const handleSave = () => {
    if (mode === "edit" && item) {
      onSave({ ...formData, id: item.id } as MosaicModuleItem);
    } else {
      onSave(formData as Omit<MosaicModuleItem, "id">);
    }
  };

  return (
    <div data-slot="module-form" className="flex flex-col gap-4 p-4">
      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="module-name" className="text-sm font-medium">
          {nameFieldLabel}
        </label>
        <input
          id="module-name"
          type="text"
          value={formData.name as string}
          onChange={(e) => update("name", e.target.value)}
          placeholder={namePlaceholder}
          required
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 min-h-[40px]",
            "text-sm placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="module-desc" className="text-sm font-medium">
          {descriptionFieldLabel}
        </label>
        <textarea
          id="module-desc"
          value={formData.description as string}
          onChange={(e) => update("description", e.target.value)}
          placeholder={descriptionPlaceholder}
          rows={3}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm placeholder:text-muted-foreground resize-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
      </div>

      {/* Extra fields */}
      {formFields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <label htmlFor={`field-${field.id}`} className="text-sm font-medium">
            {field.label}
            {field.required && " *"}
          </label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {field.type === "text" && (
            <input
              id={`field-${field.id}`}
              type="text"
              value={(formData[field.id] as string) ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 min-h-[40px]",
                "text-sm placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          )}
          {field.type === "textarea" && (
            <textarea
              id={`field-${field.id}`}
              value={(formData[field.id] as string) ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2",
                "text-sm placeholder:text-muted-foreground resize-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          )}
          {field.type === "emoji" && (
            <input
              id={`field-${field.id}`}
              type="text"
              value={(formData[field.id] as string) ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder ?? "🧠"}
              maxLength={4}
              className={cn(
                "w-20 rounded-md border border-input bg-background px-3 py-2 text-2xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          )}
          {field.type === "tag-list" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInputs[field.id] ?? ""}
                  onChange={(e) =>
                    setTagInputs((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(field.id);
                    }
                  }}
                  placeholder={field.placeholder ?? tagListAddPlaceholder}
                  className={cn(
                    "flex-1 rounded-md border border-input bg-background px-3 py-2 min-h-[36px]",
                    "text-sm placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
                <button
                  type="button"
                  onClick={() => addTag(field.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PlusIcon />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {((formData[field.id] as string[]) ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(field.id, tag)}
                      className="hover:text-destructive"
                      aria-label={`Remove ${tag}`}
                    >
                      <XIcon />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!formData.name}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          {props.mode === "edit" ? props.saveChangesLabel : props.createItemLabel}
        </button>
      </div>
    </div>
  );
}

MosaicModuleForm.displayName = "MosaicModuleForm";

// ── Module card ───────────────────────────────────────────────────────────────

function ModuleItemCard({
  item,
  onEdit,
  onDelete,
  itemActionsAriaLabel,
  editItemLabel,
  deleteItemLabel,
}: {
  item: MosaicModuleItem;
  onEdit: (item: MosaicModuleItem) => void;
  onDelete: (id: string) => void;
  itemActionsAriaLabel: string;
  editItemLabel: string;
  deleteItemLabel: string;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {item.icon && (
            <span className="shrink-0 text-xl" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm">{item.name}</p>
            {item.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {item.isCustom && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={itemActionsAriaLabel}
              aria-haspopup="menu"
            >
              <MoreVertIcon />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-md border border-border bg-popover py-1 shadow-md"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onEdit(item);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {editItemLabel}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDelete(item.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  {deleteItemLabel}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main library component (shared between desktop/mobile) ───────────────────

function LibraryContent({
  items,
  isLoading,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  tabs,
  tabFilter,
  formFields,
  title,
  createLabel,
  searchPlaceholder,
  emptyMessage,
  nameFieldLabel,
  descriptionFieldLabel,
  namePlaceholder,
  descriptionPlaceholder,
  cancelLabel,
  saveChangesLabel,
  createItemLabel,
  itemActionsAriaLabel,
  editItemLabel,
  deleteItemLabel,
  closeEditorAriaLabel,
  editModalTitle,
  tagListAddPlaceholder,
}: MosaicModuleLibraryProps) {
  const [query, setQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState(tabs?.[0]?.id ?? "all");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MosaicModuleItem | undefined>();
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");

  const openCreate = () => {
    setEditingItem(undefined);
    setEditorMode("create");
    setEditorOpen(true);
  };

  const openEdit = (item: MosaicModuleItem) => {
    setEditingItem(item);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleSave = (data: Omit<MosaicModuleItem, "id"> | MosaicModuleItem) => {
    if (editorMode === "edit" && "id" in data) {
      const { id, ...rest } = data;
      onUpdateItem(id as string, rest);
    } else {
      onCreateItem(data as Omit<MosaicModuleItem, "id">);
    }
    setEditorOpen(false);
  };

  const filtered = items.filter((item) => {
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(query.toLowerCase());
    const matchesTab = !tabFilter || tabFilter(item, activeTab);
    return matchesQuery && matchesTab;
  });

  return (
    <div data-slot="module-library" className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
          <button
            type="button"
            onClick={openCreate}
            className={cn(
              "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <PlusIcon />
            <span className="hidden sm:inline">{createLabel}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="mt-3 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ModuleItemCard
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={onDeleteItem}
                itemActionsAriaLabel={itemActionsAriaLabel}
                editItemLabel={editItemLabel}
                deleteItemLabel={deleteItemLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <MosaicAdaptiveModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editorMode === "edit" ? editModalTitle(editingItem?.name ?? "") : createLabel}
        closeAriaLabel={closeEditorAriaLabel}
      >
        <MosaicModuleForm
          item={editingItem}
          formFields={formFields}
          onSave={handleSave}
          onCancel={() => setEditorOpen(false)}
          nameFieldLabel={nameFieldLabel}
          descriptionFieldLabel={descriptionFieldLabel}
          namePlaceholder={namePlaceholder}
          descriptionPlaceholder={descriptionPlaceholder}
          cancelLabel={cancelLabel}
          tagListAddPlaceholder={tagListAddPlaceholder}
          // The library renders the form in BOTH modes, so it legitimately
          // keeps both labels required on its OWN props — and hands the form
          // exactly the one that its mode actually renders.
          {...(editorMode === "edit"
            ? ({ mode: "edit", saveChangesLabel } as const)
            : ({ mode: "create", createItemLabel } as const))}
        />
      </MosaicAdaptiveModal>
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export function MosaicModuleLibrary(props: MosaicModuleLibraryProps) {
  return <LibraryContent {...props} />;
}

MosaicModuleLibrary.displayName = "MosaicModuleLibrary";
