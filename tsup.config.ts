import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false, // prebuild script handles rimraf dist
  treeshake: true,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "tailwindcss"],
});
