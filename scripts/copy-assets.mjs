import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

mkdirSync(join(root, "dist"), { recursive: true });
copyFileSync(join(root, "src", "styles.css"), join(root, "dist", "styles.css"));
console.log("copy-assets: src/styles.css → dist/styles.css ✓");

// src/styles.css @imports "./theme/depth.css" as a RELATIVE path — a
// consumer's bundler resolves that against dist/, not src/. Every CSS file
// styles.css relatively imports must ship at the matching path under dist/,
// or the published package carries a broken @import. Currently: depth.css
// only (T1, relief + motion tokens); extend this list if styles.css grows
// more relative @imports.
mkdirSync(join(root, "dist", "theme"), { recursive: true });
copyFileSync(join(root, "src", "theme", "depth.css"), join(root, "dist", "theme", "depth.css"));
console.log("copy-assets: src/theme/depth.css → dist/theme/depth.css ✓");
