# gamma-fix-27-api-gaps — Batch-2 API gaps (closes #27)

**Version:** 0.2.2-alpha  
**Branch:** gamma/fix-27-api-gaps  
**Author:** Gamma — VantageOS Team | 2026-06-27

## Summary

Four additive/backward-compatible API gaps verified by Kappa against `dist/index.d.ts @ 0.2.0-alpha` are now closed. All changes use optional props and union type widening — no existing 0.2.x consumer is broken.

## Changes

### 1. MosaicSignInLayout — Clerk routing pass-through

Added optional props:
- `routing?: "hash" | "path" | "virtual"` — required for `[[...sign-in]]` catch-all App Router pages
- `path?: string` — base path when `routing="path"`
- `signInUrl?: string` — forwarded to the Clerk widget
- `forceRedirectUrl?: string` — Clerk v7 force-redirect (overrides query params)

All props forwarded to the injected `<SignIn>` component. Existing usage (no new props) unchanged.

### 2. MosaicSignUpLayout — Clerk routing pass-through

Same pattern as SignInLayout:
- `routing?: "hash" | "path" | "virtual"`
- `path?: string`
- `signUpUrl?: string`
- `forceRedirectUrl?: string`

### 3. MosaicClerkOrgSwitcher — afterSelectPersonalUrl + data-testid

Added optional props:
- `afterSelectPersonalUrl?: string` — forwarded to `<OrganizationSwitcher>` for personal workspace redirect
- `"data-testid"?: string` — forwarded onto the root `<div>` for e2e selectors (`data-testid="org-switcher"`)

Existing `afterCreateOrganizationUrl`, `afterSelectOrganizationUrl`, `afterLeaveOrganizationUrl`, `hidePersonal` unchanged.

### 4. MosaicActivity shape relaxation

- `status`: widened from `MosaicActivityStatus` (`"active"|"completed"|"archived"`) to `MosaicActivityStatus | (string & {})` — free strings accepted, unknown values fall back to neutral style. IDE autocomplete preserved.
- `timestamp`: widened from `string` to `string | number` — numeric Unix ms (VP `updatedAt`) formatted via `toLocaleString()`.
- `participants`: widened from `string[]` to `MosaicActivityParticipant[]` — union accepts plain strings OR `{ actor?: string; excerpt?: string }` objects. `actor` used as avatar label.
- `excerpt?: string` — new optional field surfaced as a sub-line in the item renderer.

All new fields are optional. Existing `string[]` participants and `string` timestamps continue to render identically.

## Backward compatibility

All changes are:
- Optional props added (existing call-sites compile without changes)
- Union types widened (no narrowing, no removal)
- Runtime behaviour unchanged for existing prop values
