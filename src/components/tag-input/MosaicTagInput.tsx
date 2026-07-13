/**
 * MosaicTagInput — presentational tag/chip input with optional autocomplete.
 *
 * Controlled component: `tags` is the single source of truth, supplied and
 * owned by the host. This component never keeps its own copy of the tag
 * list — it only reports add/remove intents via `onAddTag`/`onRemoveTag`,
 * same controlled-callback shape as `MosaicResizableSplitPane` and
 * `MosaicToolToggleList`.
 *
 * Filtering of `suggestions` follows the `MosaicCombobox` convention:
 * `@base-ui/react/combobox`'s `useFilter({ sensitivity: "base" }).contains`
 * strategy, additionally excluding tags already selected.
 *
 * `maxTags` is enforced LOUDLY, never silently: past the cap, the
 * underlying input exposes `aria-disabled="true"` and
 * `data-max-reached="true"` so a host/test can observe the refusal, not
 * just infer it from a missing callback call.
 *
 * data-slot="tag-input" on the root, data-slot="tag-input-tag" on each chip.
 * Bilingual: `placeholder` and `removeTagAriaLabel` are required
 * host-supplied props — zero hardcoded copy, zero default (SIN-01).
 *
 * No "use client" in source — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --background, --ring, --accent,
 * --accent-foreground, --foreground, --muted-foreground.
 *
 * @example
 * <MosaicTagInput
 *   tags={tags}
 *   onAddTag={(tag) => setTags((prev) => [...prev, tag])}
 *   onRemoveTag={(tag) => setTags((prev) => prev.filter((t) => t !== tag))}
 *   placeholder="Ajouter un tag…"
 *   removeTagAriaLabel={(tag) => `Retirer ${tag}`}
 *   suggestions={["react", "vue", "svelte"]}
 *   maxTags={10}
 * />
 */

import { Combobox } from "@base-ui/react/combobox";
import type * as React from "react";
import { useMemo, useRef, useState } from "react";
import {
  tagInputFieldVariants,
  tagInputRemoveButtonVariants,
  tagInputRootVariants,
  tagInputTagVariants,
} from "./tag-input-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Merges an external React-19 ref prop with an internally-held ref. */
function mergeRefs<T>(externalRef: React.Ref<T> | undefined, node: T | null) {
  if (typeof externalRef === "function") {
    externalRef(node);
  } else if (externalRef && typeof externalRef === "object") {
    (externalRef as React.MutableRefObject<T | null>).current = node;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicTagInputProps {
  /** Current list of tags. Controlled — the host owns the source of truth. */
  tags: string[];
  /** Called when a new tag should be added. */
  onAddTag: (tag: string) => void;
  /** Called when a tag should be removed. */
  onRemoveTag: (tag: string) => void;
  /** Input placeholder. Required — host-supplied, host-localized. */
  placeholder: string;
  /** Per-tag accessible name for the remove button. Required, no default. */
  removeTagAriaLabel: (tag: string) => string;
  /** Optional autocomplete source, filtered with "contains" against typed text. */
  suggestions?: string[];
  /** Maximum number of tags allowed. */
  maxTags?: number;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the underlying input. */
  ref?: React.Ref<HTMLInputElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTagInput — production tag/chip input atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational and fully controlled: renders `tags` as removable
 * chips plus a text field, reports add/remove intents via callbacks, and
 * optionally suggests matches from a host-supplied `suggestions` list.
 */
export function MosaicTagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  removeTagAriaLabel,
  suggestions,
  maxTags,
  className,
  ref,
}: MosaicTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filter = Combobox.useFilter({ sensitivity: "base" });

  const isMaxReached = maxTags !== undefined && tags.length >= maxTags;

  const trimmedValue = inputValue.trim();

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || trimmedValue.length === 0) return [];
    return suggestions.filter(
      (suggestion) => !tags.includes(suggestion) && filter.contains(suggestion, trimmedValue),
    );
  }, [suggestions, tags, trimmedValue, filter]);

  function commitTag(rawValue: string) {
    if (isMaxReached) return;
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) return;
    if (tags.includes(trimmed)) return;
    onAddTag(trimmed);
    setInputValue("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTag(inputValue);
      return;
    }
    if (event.key === "Backspace" && inputValue.length === 0 && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag !== undefined) onRemoveTag(lastTag);
    }
  }

  return (
    <div data-slot="tag-input" className={cn(tagInputRootVariants(), className)}>
      {tags.map((tag) => (
        <span key={tag} data-slot="tag-input-tag" className={tagInputTagVariants()}>
          {tag}
          <button
            type="button"
            aria-label={removeTagAriaLabel(tag)}
            data-slot="tag-input-remove-button"
            className={tagInputRemoveButtonVariants()}
            onClick={() => onRemoveTag(tag)}
          >
            ×
          </button>
        </span>
      ))}

      <input
        ref={(node) => {
          inputRef.current = node;
          mergeRefs(ref, node);
        }}
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-disabled={isMaxReached ? true : undefined}
        data-max-reached={isMaxReached ? true : undefined}
        data-slot="tag-input-field"
        className={tagInputFieldVariants()}
      />

      {filteredSuggestions.length > 0 && (
        <ul
          data-slot="tag-input-suggestions"
          className={cn(
            "z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-border",
            "bg-popover p-1 text-sm text-popover-foreground shadow-md",
          )}
        >
          {filteredSuggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                data-slot="tag-input-suggestion"
                className="w-full cursor-pointer select-none rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-[2px]"
                onClick={() => commitTag(suggestion)}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

MosaicTagInput.displayName = "MosaicTagInput";
