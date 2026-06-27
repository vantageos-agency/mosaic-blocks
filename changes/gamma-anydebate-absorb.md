# Release fragment — gamma/anydebate-absorb

**Package**: `@vantageos/mosaic-blocks`
**Version**: `0.2.0-alpha` (bumped from `0.1.0-alpha.1`)
**Branch**: `gamma/anydebate-absorb`
**Date**: 2026-06-27

## What changed

### Mission: mosaic-blocks-absorb-anydebate-v1 (T1 → T3)

**T1 — Component absorb (anydebate shell)**
- Absorbed full anydebate production shell: `MosaicDashboardLayout`, `MosaicSidebar`, `MosaicHeader`, nav system
- Wave-1 components: layout primitives, device provider, adaptive system (AdaptiveGrid / AdaptiveModal / AdaptiveNavigation)
- Wave-2 components: debate-specific blocks, agent composer, org panel, multi-tenant auth components

**T1.5 — CI and quality gates**
- Storybook 8 → 10 upgrade with 69 stories across all wave-1 + wave-2 components
- vitest suite: 396 tests passing
- 7-gate CI pipeline: typecheck, lint, test, build, size, a11y, storybook

**T2 — Auth and multi-tenant integration**
- `MosaicMultiTenantProvider` — Clerk + `@vantageos/cloud-identity` wiring
- `MosaicClerkWebhookHandler` — Next.js route handler for Clerk webhook sync (svix optional peer dep)
- `MosaicSignInCard` / `MosaicSignUpCard` — styled auth flows
- `MosaicOrgPanel` / `MosaicOrgSwitcher` — org management UI

**T2.5 — Consumer documentation**
- `docs/components-catalog.md` — exhaustive 85-component catalog with import paths
- `docs/auth.md` — Clerk integration, RBAC, webhook sync guide
- `docs/mobile-first.md` — DeviceProvider, adaptive system, responsive-pair pattern

**T3 — Publish prep (this commit)**
- LICENSE: MIT → FSL-1.1-Apache-2.0 (canonical FSL, sha256 `3d458972...`)
- `package.json`: version `0.1.0-alpha.1` → `0.2.0-alpha`, license field updated, keywords added, LICENSE added to `files`
- README.md: full 17-section vitrine README (280+ lines), cross-links all 3 docs/ consumer guides
- `changes/gamma-anydebate-absorb.md`: this fragment (Hephaistos doctrine — do not edit CHANGELOG.md)

## No publish
Dry-run only. Publish is gated behind Eta APPROVED review.
