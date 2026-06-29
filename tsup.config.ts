import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    server: "src/server.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false, // prebuild script handles rimraf dist
  treeshake: true,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "tailwindcss"],
  // Note: "use client" is prepended post-build via scripts/prepend-use-client.mjs.
  // tsup/esbuild strips module-level directives when bundling multiple modules
  // into a single output file. The post-build script is the only reliable way
  // to ensure the directive survives in the published dist. See #25.
});
