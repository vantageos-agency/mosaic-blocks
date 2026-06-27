"use client";

/**
 * MosaicPreferencesPanel — generic user preferences form
 *
 * Ported from components/settings/preferences-panel.tsx
 *
 * Fully controlled via props. No internal toast calls, no API calls.
 * Consumers wire onSave + manage state externally if needed.
 * Strip: useToast, debate-specific model names (passed as items[]).
 */

import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSelectItem {
  value: string;
  label: string;
}

export interface MosaicPreference {
  id: string;
  label: string;
  description?: string;
  type: "select" | "toggle";
  value: string | boolean;
  /** For type="select" — list of options */
  options?: MosaicSelectItem[];
}

export interface MosaicPreferenceGroup {
  id: string;
  title: string;
  description?: string;
  preferences: MosaicPreference[];
}

export interface MosaicPreferencesPanelProps {
  /** Grouped preference sections */
  groups: MosaicPreferenceGroup[];
  /** Called with updated key/value when a preference changes */
  onChange: (id: string, value: string | boolean) => void;
  /** Called when user clicks Save */
  onSave: () => void;
  /** Whether the save action is pending */
  isSaving?: boolean;
  /** Label for the save button (default "Save Preferences") */
  saveLabel?: string;
  className?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg",
          "transform transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function NativeSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: MosaicSelectItem[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-2",
        "text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MosaicPreferencesPanel({
  groups,
  onChange,
  onSave,
  isSaving = false,
  saveLabel = "Save Preferences",
  className,
}: MosaicPreferencesPanelProps) {
  const { isMobile } = useDevice();

  return (
    <div data-slot="preferences-panel" className={cn("space-y-4 md:space-y-6", className)}>
      {groups.map((group) => (
        <div
          key={group.id}
          className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        >
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight md:text-xl">
              {group.title}
            </h3>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
          <div className="p-6 pt-0 space-y-4 md:space-y-6">
            {group.preferences.map((pref) => (
              <div key={pref.id}>
                {pref.type === "select" && (
                  <div className="space-y-2">
                    <label htmlFor={pref.id} className="text-base font-medium leading-none">
                      {pref.label}
                    </label>
                    {pref.description && (
                      <p className="text-sm text-muted-foreground">{pref.description}</p>
                    )}
                    <NativeSelect
                      id={pref.id}
                      value={pref.value as string}
                      options={pref.options ?? []}
                      onChange={(v) => onChange(pref.id, v)}
                    />
                  </div>
                )}
                {pref.type === "toggle" && (
                  <div className="flex min-h-[44px] items-center justify-between">
                    <div className="space-y-0.5">
                      <label htmlFor={pref.id} className="cursor-pointer text-base font-medium">
                        {pref.label}
                      </label>
                      {pref.description && (
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      )}
                    </div>
                    <Toggle
                      id={pref.id}
                      checked={pref.value as boolean}
                      onChange={(v) => onChange(pref.id, v)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={cn("flex", isMobile ? "flex-col" : "justify-end")}>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md",
            "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            isMobile ? "w-full" : "w-auto",
          )}
        >
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
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {isSaving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

MosaicPreferencesPanel.displayName = "MosaicPreferencesPanel";
