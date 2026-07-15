"use client";

/**
 * MosaicMentionInput — text input that opens an anchored, host-owned list of
 * mentionable entries when the host-chosen trigger character is typed.
 *
 * Built on `MosaicPopover` for anchoring and dismissal (Escape, outside
 * click) — this component does not re-implement either. It owns exactly
 * three things:
 * 1. Detecting the trigger character and the query fragment typed after it,
 *    reported to the host via `onQueryChange` — the host decides what
 *    "matches" means, this component never filters.
 * 2. Roving keyboard navigation (ArrowUp/ArrowDown, wrap-free, clamped) over
 *    whichever entries the host currently supplies via `entries`.
 * 3. Inserting the host-chosen text for the selected entry back into the
 *    input value and reporting the selection via `onSelectEntry`.
 *
 * The mentionable entries themselves — their data, their rendering, and the
 * decision of which ones currently match the typed query — belong entirely
 * to the host, exactly like `MosaicTemplateList`'s `renderItem` idiom: this
 * component never hardcodes, invents, fetches, or filters an entry.
 *
 * SIN-01: the component carries zero visible strings. `inputAriaLabel`,
 * `listAriaLabel`, and `emptyMessage` are all required props with no
 * default — the host supplies every word.
 *
 * Trigger-detection note: scans backward from the caret for the trigger
 * character, stopping at the first whitespace. This models a single-glyph
 * trigger (e.g. "@") — the common case; a multi-character trigger is not a
 * supported shape here.
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { MosaicPopover } from "../popover/MosaicPopover.js";
import {
  mentionInputFieldVariants,
  mentionListItemVariants,
  mentionListVariants,
} from "./mention-input-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Scans backward from `cursor` for `trigger`, stopping at the first
 * whitespace character. Returns the index of the trigger character, or
 * `null` when the caret is not currently inside a mention context.
 */
function findMentionStart(text: string, cursor: number, trigger: string): number | null {
  for (let i = cursor - 1; i >= 0; i--) {
    const char = text[i];
    if (char === trigger) {
      return i;
    }
    if (/\s/.test(char)) {
      return null;
    }
  }
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MosaicMentionInputProps<T extends { id: string }> {
  /** Controlled input value — the host owns the truth. */
  value: string;
  /** Called with the next value on every keystroke and on mention insertion. */
  onValueChange: (value: string) => void;
  /** The character that opens the mention list (e.g. "@"). Single glyph. */
  triggerCharacter: string;
  /**
   * The entries to show in the list. Host-owned and, when the host is
   * filtering as the user types, already filtered — this component never
   * inspects or narrows this array itself.
   */
  entries: T[];
  /** Host-owned renderer for a single entry; `active` marks the roving selection. */
  renderEntry: (entry: T, index: number, active: boolean) => React.ReactNode;
  /** Host-owned mapping from an entry to the plain text inserted on selection. */
  getEntryText: (entry: T) => string;
  /**
   * Called with the fragment typed after the trigger character (may be an
   * empty string right after the trigger), or `null` when the caret is not
   * inside a mention context (list closed).
   */
  onQueryChange: (query: string | null) => void;
  /** Called with the chosen entry when the host or user picks one. */
  onSelectEntry?: (entry: T) => void;
  /** Required accessible name for the text input — no default (SIN-01). */
  inputAriaLabel: string;
  /** Required accessible name for the entries list — no default (SIN-01). */
  listAriaLabel: string;
  /** Required message shown when `entries` is empty while the list is open. */
  emptyMessage: string;
  className?: string;
  inputClassName?: string;
}

/**
 * MosaicMentionInput — production mention-input atom for
 * @vantageos/mosaic-blocks.
 *
 * @example
 * <MosaicMentionInput
 *   value={draft}
 *   onValueChange={setDraft}
 *   triggerCharacter="@"
 *   entries={filteredPeople}
 *   getEntryText={(person) => person.name}
 *   renderEntry={(person, _i, active) => (
 *     <PersonRow person={person} active={active} />
 *   )}
 *   onQueryChange={(query) => setFragment(query)}
 *   onSelectEntry={(person) => trackMention(person)}
 *   inputAriaLabel={t('Composer.inputLabel')}
 *   listAriaLabel={t('Composer.mentionListLabel')}
 *   emptyMessage={t('Composer.noMatches')}
 * />
 */
export function MosaicMentionInput<T extends { id: string }>({
  value,
  onValueChange,
  triggerCharacter,
  entries,
  renderEntry,
  getEntryText,
  onQueryChange,
  onSelectEntry,
  inputAriaLabel,
  listAriaLabel,
  emptyMessage,
  className,
  inputClassName,
}: MosaicMentionInputProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const open = mentionStart !== null;

  function closeMention() {
    setMentionStart(null);
    setActiveIndex(0);
    onQueryChange(null);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    const cursor = event.target.selectionStart ?? nextValue.length;
    onValueChange(nextValue);

    const start = findMentionStart(nextValue, cursor, triggerCharacter);
    if (start === null) {
      if (open) {
        closeMention();
      }
      return;
    }
    setMentionStart(start);
    setActiveIndex(0);
    onQueryChange(nextValue.slice(start + triggerCharacter.length, cursor));
  }

  function selectEntry(entry: T) {
    if (mentionStart === null || !inputRef.current) {
      return;
    }
    const cursor = inputRef.current.selectionStart ?? value.length;
    const insertText = getEntryText(entry);
    const nextValue = `${value.slice(0, mentionStart)}${insertText} ${value.slice(cursor)}`;
    onValueChange(nextValue);
    onSelectEntry?.(entry);
    closeMention();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMention();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(entries.length - 1, index + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (event.key === "Enter") {
      const entry = entries[activeIndex];
      if (entry) {
        event.preventDefault();
        selectEntry(entry);
      }
    }
  }

  return (
    <div data-slot="mention-input" className={className}>
      <input
        ref={inputRef}
        type="text"
        aria-label={inputAriaLabel}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(mentionInputFieldVariants(), inputClassName)}
      />
      <MosaicPopover
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeMention();
          }
        }}
        anchor={inputRef}
        initialFocus={false}
        aria-label={listAriaLabel}
      >
        {entries.length === 0 ? (
          <p data-slot="mention-input-empty" className="px-2 py-1.5 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul data-slot="mention-input-list" className={mentionListVariants()}>
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                data-slot="mention-input-item"
                aria-selected={index === activeIndex}
                className={mentionListItemVariants({ active: index === activeIndex })}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectEntry(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectEntry(entry);
                  }
                }}
              >
                {renderEntry(entry, index, index === activeIndex)}
              </li>
            ))}
          </ul>
        )}
      </MosaicPopover>
    </div>
  );
}

MosaicMentionInput.displayName = "MosaicMentionInput";
