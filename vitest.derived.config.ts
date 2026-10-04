import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * The DERIVED-docs suite, and why it needs a config of its own.
 *
 * `src/__tests__/derived/` asserts that README + catalog counts match
 * src/index.ts. The release-artifacts guard forbids a PR from hand-editing those
 * counts — so the main config EXCLUDES this directory, otherwise every PR that
 * adds an export is unmergeable (the guard forbids touching the counts; this
 * suite demanded they be touched).
 *
 * But an exclusion in the shared config also silences the suite when you ask for
 * it BY NAME: `vitest run src/__tests__/derived` collected ZERO tests and exited
 * green. A guard that passes while measuring nothing is worse than no guard —
 * it is a guard nobody will question.
 *
 * Hence a dedicated config: it INCLUDES only this directory and excludes nothing
 * of it. The ci.yml step that runs it (executed locally by `pnpm gate:local`, since
 * GitHub Actions is off) also asserts the collected count is non-zero.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/__tests__/derived/**/*.test.ts"],
  },
});
