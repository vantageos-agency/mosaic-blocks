"use client";

/**
 * MosaicOrgPanel — generic multi-tenant organization management shell
 *
 * Ported from components/organization/ (OrgOverview desktop/mobile,
 *   OrgSettings desktop/mobile, MemberList desktop/mobile, role-badge,
 *   multi-org-indicator, create/invite dialogs)
 *
 * IMPORTANT: All Clerk/Convex calls STRIPPED. This is a PURE PRESENTATIONAL
 * shell. Data + handlers come entirely via props. Auth wiring is T1.5.
 *
 * Exports:
 *   MosaicOrgPanel            — responsive org management (tabs: overview/members/settings)
 *   MosaicOrgRoleBadge        — member role badge
 *   MosaicMultiOrgIndicator   — multi-org count badge
 *   MosaicCreateOrgDialog     — create org form modal
 *   MosaicInviteMemberDialog  — invite member form modal
 *   MosaicMemberList          — responsive member list (responsive-pair)
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicOrgRole = "admin" | "member" | "owner";

export interface MosaicOrgMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: MosaicOrgRole;
  joinedAt?: string | number | Date;
}

export interface MosaicOrgStats {
  totalMembers?: number;
  totalItems?: number;
  storageUsed?: number;
  storageTotal?: number;
  [key: string]: number | undefined;
}

export interface MosaicOrgInfo {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  stats?: MosaicOrgStats;
}

export interface MosaicStatItem {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
}

// ── MosaicOrgRoleBadge ────────────────────────────────────────────────────────

const roleConfig: Record<MosaicOrgRole, { label: string; className: string; description: string }> =
  {
    owner: {
      label: "Owner",
      className: "bg-primary text-primary-foreground",
      description: "Full access including billing and organization deletion",
    },
    admin: {
      label: "Admin",
      className: "bg-secondary text-secondary-foreground",
      description: "Full access to organization settings and member management",
    },
    member: {
      label: "Member",
      className: "bg-muted text-muted-foreground",
      description: "Standard access to workspaces and content",
    },
  };

export interface MosaicOrgRoleBadgeProps {
  role: MosaicOrgRole;
  className?: string;
}

export function MosaicOrgRoleBadge({ role, className }: MosaicOrgRoleBadgeProps) {
  const config = roleConfig[role] ?? roleConfig.member;
  return (
    <span
      data-slot="org-role-badge"
      title={config.description}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

MosaicOrgRoleBadge.displayName = "MosaicOrgRoleBadge";

// ── MosaicMultiOrgIndicator ───────────────────────────────────────────────────

export interface MosaicMultiOrgIndicatorProps {
  orgCount: number;
  currentOrgName?: string;
  onSwitchOrg?: () => void;
  className?: string;
}

export function MosaicMultiOrgIndicator({
  orgCount,
  currentOrgName,
  onSwitchOrg,
  className,
}: MosaicMultiOrgIndicatorProps) {
  if (orgCount <= 1) return null;

  return (
    <div data-slot="multi-org-indicator" className={cn("flex items-center gap-2", className)}>
      {onSwitchOrg ? (
        <button
          type="button"
          onClick={onSwitchOrg}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
            "hover:bg-secondary/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {orgCount} orgs
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {orgCount} orgs
        </span>
      )}
      {currentOrgName && <span className="text-xs text-muted-foreground">{currentOrgName}</span>}
    </div>
  );
}

MosaicMultiOrgIndicator.displayName = "MosaicMultiOrgIndicator";

// ── MosaicCreateOrgDialog ─────────────────────────────────────────────────────

export interface MosaicCreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrg: (data: { name: string; slug: string; description?: string }) => void | Promise<void>;
  isLoading?: boolean;
  title?: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  closeAriaLabel: string;
  orgNameFieldLabel: string;
  orgNamePlaceholder: string;
  slugFieldLabel: string;
  descriptionFieldLabel: string;
  descriptionPlaceholder: string;
  cancelLabel: string;
  creatingLabel: string;
  createLabel: string;
}

export function MosaicCreateOrgDialog({
  open,
  onOpenChange,
  onCreateOrg,
  isLoading = false,
  title = "Create Organization", // allow-hardcode-i18n: pre-existing optional default, unrelated to this PR's guard scope
  closeAriaLabel,
  orgNameFieldLabel,
  orgNamePlaceholder,
  slugFieldLabel,
  descriptionFieldLabel,
  descriptionPlaceholder,
  cancelLabel,
  creatingLabel,
  createLabel,
}: MosaicCreateOrgDialogProps) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!slug.trim()) errs.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(slug))
      errs.slug = "Slug: lowercase letters, numbers, hyphens only";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onCreateOrg({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
    });
    setName("");
    setSlug("");
    setDescription("");
    setErrors({});
    onOpenChange(false);
  };

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!name) {
      setSlug("");
      return;
    }
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }, [name]);

  return (
    <MosaicAdaptiveModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      closeAriaLabel={closeAriaLabel}
    >
      <form
        data-slot="create-org-dialog"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-4"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="org-name" className="text-sm font-medium">
            {orgNameFieldLabel}
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={orgNamePlaceholder}
            required
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 min-h-[40px] text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.name ? "border-destructive" : "border-input",
            )}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        {/* Slug */}
        <div className="space-y-1.5">
          <label htmlFor="org-slug" className="text-sm font-medium">
            {slugFieldLabel}
          </label>
          <input
            id="org-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-inc"
            required
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 min-h-[40px] text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.slug ? "border-destructive" : "border-input",
            )}
          />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="org-desc" className="text-sm font-medium">
            {descriptionFieldLabel}
          </label>
          <textarea
            id="org-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={descriptionPlaceholder}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? creatingLabel : createLabel}
          </button>
        </div>
      </form>
    </MosaicAdaptiveModal>
  );
}

MosaicCreateOrgDialog.displayName = "MosaicCreateOrgDialog";

// ── MosaicInviteMemberDialog ──────────────────────────────────────────────────

export interface MosaicInviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: { email: string; role: MosaicOrgRole }) => void | Promise<void>;
  isLoading?: boolean;
  roles?: Array<{ value: MosaicOrgRole; label: string }>;
  title?: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  closeAriaLabel: string;
  emailFieldLabel: string;
  emailPlaceholder: string;
  roleFieldLabel: string;
  cancelLabel: string;
  sendingLabel: string;
  sendInvitationLabel: string;
}

const DEFAULT_ROLES: Array<{ value: MosaicOrgRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

export function MosaicInviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
  roles = DEFAULT_ROLES,
  title = "Invite Member", // allow-hardcode-i18n: pre-existing optional default, unrelated to this PR's guard scope
  closeAriaLabel,
  emailFieldLabel,
  emailPlaceholder,
  roleFieldLabel,
  cancelLabel,
  sendingLabel,
  sendInvitationLabel,
}: MosaicInviteMemberDialogProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<MosaicOrgRole>("member");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onInvite({ email: email.trim(), role });
    setEmail("");
    setRole("member");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <MosaicAdaptiveModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      closeAriaLabel={closeAriaLabel}
    >
      <form
        data-slot="invite-member-dialog"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="text-sm font-medium">
            {emailFieldLabel}
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 min-h-[40px] text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.email ? "border-destructive" : "border-input",
            )}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="invite-role" className="text-sm font-medium">
            {roleFieldLabel}
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as MosaicOrgRole)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[44px] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? sendingLabel : sendInvitationLabel}
          </button>
        </div>
      </form>
    </MosaicAdaptiveModal>
  );
}

MosaicInviteMemberDialog.displayName = "MosaicInviteMemberDialog";

// ── MosaicMemberList ──────────────────────────────────────────────────────────

export interface MosaicMemberListProps {
  members: MosaicOrgMember[];
  currentUserId?: string;
  onChangeRole?: (memberId: string, role: MosaicOrgRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onInvite?: () => void;
  roles?: Array<{ value: MosaicOrgRole; label: string }>;
  isLoading?: boolean;
  searchPlaceholder?: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  youLabel: string;
  memberActionsAriaLabel: string;
  removeMemberLabel: string;
  emptyMessage: string;
  inviteLabel: string;
  className?: string;
}

function MemberRow({
  member,
  currentUserId,
  onChangeRole,
  onRemoveMember,
  roles,
  youLabel,
  memberActionsAriaLabel,
  removeMemberLabel,
}: {
  member: MosaicOrgMember;
  currentUserId?: string;
  onChangeRole?: (id: string, role: MosaicOrgRole) => void;
  onRemoveMember?: (id: string) => void;
  roles?: Array<{ value: MosaicOrgRole; label: string }>;
  youLabel: string;
  memberActionsAriaLabel: string;
  removeMemberLabel: string;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const isSelf = member.id === currentUserId;

  React.useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const joinedDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : undefined;

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{member.name}</p>
          {isSelf && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {youLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        {joinedDate && <p className="text-xs text-muted-foreground">Joined {joinedDate}</p>}
      </div>
      <MosaicOrgRoleBadge role={member.role} />
      {!isSelf && (onChangeRole || onRemoveMember) && (
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={memberActionsAriaLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-md"
            >
              {onChangeRole &&
                roles?.map(
                  (r) =>
                    r.value !== member.role && (
                      <button
                        key={r.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onChangeRole(member.id, r.value);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Make {r.label}
                      </button>
                    ),
                )}
              {onRemoveMember && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onRemoveMember(member.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  {removeMemberLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MosaicMemberList({
  members,
  currentUserId,
  onChangeRole,
  onRemoveMember,
  onInvite,
  roles = DEFAULT_ROLES,
  isLoading,
  searchPlaceholder = "Search members…",
  youLabel,
  memberActionsAriaLabel,
  removeMemberLabel,
  emptyMessage,
  inviteLabel,
  className,
}: MosaicMemberListProps) {
  const [query, setQuery] = React.useState("");

  const filtered = members.filter(
    (m) =>
      !query ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div data-slot="member-list" className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {onInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            {inviteLabel}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              onChangeRole={onChangeRole}
              onRemoveMember={onRemoveMember}
              roles={roles}
              youLabel={youLabel}
              memberActionsAriaLabel={memberActionsAriaLabel}
              removeMemberLabel={removeMemberLabel}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

MosaicMemberList.displayName = "MosaicMemberList";

// ── MosaicOrgPanel (main orchestrator with tabs) ──────────────────────────────

export interface MosaicOrgPanelTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface MosaicOrgPanelProps {
  org: MosaicOrgInfo;
  tabs?: MosaicOrgPanelTab[];
  defaultTab?: string;
  /** Header-right slot (actions, invite button, etc.) */
  headerActions?: React.ReactNode;
  className?: string;
}

export function MosaicOrgPanel({
  org,
  tabs = [],
  defaultTab,
  headerActions,
  className,
}: MosaicOrgPanelProps) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = React.useState(defaultTab ?? tabs[0]?.id ?? "");

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div data-slot="org-panel" className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">
              {org.avatarUrl ? (
                <img
                  src={org.avatarUrl}
                  alt={org.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                org.name[0]?.toUpperCase()
              )}
            </span>
            <div>
              <h1 className="text-base font-semibold md:text-lg">{org.name}</h1>
              {org.slug && <p className="text-xs text-muted-foreground">@{org.slug}</p>}
            </div>
          </div>
          {headerActions}
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className={cn("mt-4 flex gap-1", isMobile && "overflow-x-auto")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">{activeContent}</div>
    </div>
  );
}

MosaicOrgPanel.displayName = "MosaicOrgPanel";
