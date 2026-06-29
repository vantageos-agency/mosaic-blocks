/**
 * @vantageos/mosaic-blocks/server
 *
 * Server-safe subpath export — pure, non-component helpers only.
 * NO "use client" directive. Safe to import in React Server Components (RSC),
 * Next.js App Router server layouts/pages, and Node.js scripts.
 *
 * What lives here: CVA variant functions (buttonVariants, badgeVariants) and
 * any other pure utilities that have NO React runtime / no hooks / no context.
 *
 * What NEVER lives here: React components, hooks, createContext, anything that
 * would cause the "Attempted to call X() from the server but X is on the client"
 * error when "use client" bleeds in transitively.
 *
 * Consumer:
 *   import { buttonVariants, badgeVariants } from "@vantageos/mosaic-blocks/server";
 *   const cls = buttonVariants({ variant: "secondary", size: "sm" });
 */

// ── buttonVariants — cva variant function for MosaicButton ───────────────────
// Source: src/components/button/button-variants.ts (isolated — no React import)
// Safe: depends only on class-variance-authority (pure, no browser APIs).
export { buttonVariants } from "./components/button/button-variants.js";

// ── badgeVariants — cva variant function for MosaicBadge ─────────────────────
// Source: src/components/badge/badge-variants.ts (isolated — no React import)
// Safe: depends only on class-variance-authority (pure, no browser APIs).
export { badgeVariants } from "./components/badge/badge-variants.js";
