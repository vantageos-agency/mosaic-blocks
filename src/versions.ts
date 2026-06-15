/**
 * Pinned-dependency catalog — single source of truth for all dependency versions
 * across the lib package and the Next.js sandbox.
 *
 * Pattern adapted from awslabs/nx-plugin-for-aws (Apache 2.0).
 * Source: https://github.com/awslabs/nx-plugin-for-aws
 *
 * HOW TO UPDATE
 * 1. Edit the version string(s) here.
 * 2. Run `pnpm sync-versions` to propagate changes into package.json files.
 * 3. The vitest test in `src/versions.test.ts` will fail on drift — CI catches it.
 */

export const versions = {
  // ── Runtime / peer deps ─────────────────────────────────────────────────────
  react: "^19",
  "react-dom": "^19",
  "@base-ui/react": "^1.5.0",

  // ── Next.js sandbox ─────────────────────────────────────────────────────────
  next: "16.2.9",

  // ── Styling ─────────────────────────────────────────────────────────────────
  tailwindcss: "^4.3.1",
  "@tailwindcss/postcss": "^4.3.1",

  // ── Build tooling ────────────────────────────────────────────────────────────
  tsup: "^8.5.0",
  typescript: "^5.8.3",
  rimraf: "^6.0.1",

  // ── Type definitions ─────────────────────────────────────────────────────────
  // NOTE: @types/node is intentionally omitted — lib and sandbox pin different
  // major versions (22 vs 25) and are managed independently.
  "@types/react": "^19",
  "@types/react-dom": "^19",

  // ── Linting ──────────────────────────────────────────────────────────────────
  "@biomejs/biome": "^1.9.4",

  // ── Testing ──────────────────────────────────────────────────────────────────
  vitest: "^3.2.3",
  "@vitejs/plugin-react": "^4.5.2",
  "@testing-library/react": "^16.3.0",
  jsdom: "^26.1.0",
} as const;

export type VersionKey = keyof typeof versions;
