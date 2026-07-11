"use client";

/**
 * MosaicProfilePanel — generic user profile form
 *
 * Ported from components/settings/profile-panel.tsx
 *
 * Fully controlled via props. No internal toast calls, no API calls.
 * Consumers wire onSave, onAvatarUpload, onChange externally.
 * Avatar upload trigger is a slot (optional). No Radix Avatar dep — CSS initials fallback.
 */

import type * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicProfileField {
  id: string;
  label: string;
  type?: "text" | "email" | "textarea" | "password";
  value: string;
  placeholder?: string;
  readOnly?: boolean;
}

export interface MosaicProfilePanelProps {
  /** Display name — used for avatar initials fallback */
  displayName?: string;
  /** Avatar image URL */
  avatarSrc?: string;
  /** Profile fields to render */
  fields?: MosaicProfileField[];
  /** Called when a field value changes */
  onFieldChange?: (id: string, value: string) => void;
  /** Called when user clicks Save */
  onSave: () => void;
  /** Whether save is pending */
  isSaving?: boolean;
  /** Called when user clicks the avatar upload button */
  onAvatarUpload?: () => void;
  /** Custom sections to render below the form */
  extraSections?: React.ReactNode;
  /** Label for the save button. Required, no default. */
  saveLabel: string;
  /** Security section: called when user clicks "Change Password" */
  onChangePassword?: () => void;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  avatarHeading: string;
  avatarSubheading: string;
  uploadPhotoLabel: string;
  personalInfoHeading: string;
  personalInfoSubheading: string;
  securityHeading: string;
  securitySubheading: string;
  changePasswordLabel: string;
  savingLabel: string;
  /**
   * Fallback name used for avatar initials when `displayName` is empty.
   * Required, no default.
   */
  unnamedUserLabel: string;
  className?: string;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AvatarDisplay({
  src,
  name,
  size,
}: {
  src?: string;
  name: string;
  size: "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-20 w-20 text-xl";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold overflow-hidden",
        sizeClass,
      )}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MosaicProfilePanel({
  displayName = "",
  avatarSrc,
  fields = [],
  onFieldChange,
  onSave,
  isSaving = false,
  onAvatarUpload,
  extraSections,
  saveLabel,
  onChangePassword,
  avatarHeading,
  avatarSubheading,
  uploadPhotoLabel,
  personalInfoHeading,
  personalInfoSubheading,
  securityHeading,
  securitySubheading,
  changePasswordLabel,
  savingLabel,
  unnamedUserLabel,
  className,
}: MosaicProfilePanelProps) {
  const { isMobile } = useDevice();

  return (
    <div data-slot="profile-panel" className={cn("space-y-4 md:space-y-6", className)}>
      {/* Avatar section */}
      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight md:text-xl">
            {avatarHeading}
          </h3>
          <p className="text-sm text-muted-foreground">{avatarSubheading}</p>
        </div>
        <div className="p-6 pt-0">
          <div className="flex items-center gap-4">
            <AvatarDisplay
              src={avatarSrc}
              name={displayName || unnamedUserLabel}
              size={isMobile ? "md" : "lg"}
            />
            {onAvatarUpload && (
              <button
                type="button"
                onClick={onAvatarUpload}
                className={cn(
                  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-border",
                  "bg-background px-4 py-2 text-sm font-medium text-foreground",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploadPhotoLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile fields */}
      {fields.length > 0 && (
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight md:text-xl">
              {personalInfoHeading}
            </h3>
            <p className="text-sm text-muted-foreground">{personalInfoSubheading}</p>
          </div>
          <div className="p-6 pt-0 space-y-4 md:space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-base font-medium leading-none">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.id}
                    value={field.value}
                    readOnly={field.readOnly}
                    placeholder={field.placeholder}
                    onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                    rows={4}
                    className={cn(
                      "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm text-foreground placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                    )}
                  />
                ) : (
                  <input
                    id={field.id}
                    type={field.type ?? "text"}
                    value={field.value}
                    readOnly={field.readOnly}
                    placeholder={field.placeholder}
                    onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                    className={cn(
                      "flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm text-foreground placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security section */}
      {onChangePassword && (
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight md:text-xl">
              {securityHeading}
            </h3>
            <p className="text-sm text-muted-foreground">{securitySubheading}</p>
          </div>
          <div className="p-6 pt-0">
            <button
              type="button"
              onClick={onChangePassword}
              className={cn(
                "inline-flex min-h-[44px] items-center justify-center rounded-md border border-border",
                "bg-background px-4 py-2 text-sm font-medium text-foreground",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isMobile ? "w-full" : "w-auto",
              )}
            >
              {changePasswordLabel}
            </button>
          </div>
        </div>
      )}

      {extraSections}

      {/* Save button */}
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
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}

MosaicProfilePanel.displayName = "MosaicProfilePanel";
