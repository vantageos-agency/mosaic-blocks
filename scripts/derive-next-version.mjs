#!/usr/bin/env node
/**
 * derive-next-version.mjs — resolves the NEXT version to publish, derived
 * from what the npm registry actually serves right now, and writes it into
 * package.json + src/version.ts.
 *
 * Why this exists (mosaic-blocks train TOCTOU, 2026-07-13): a hand-typed
 * version in a component PR is a value a machine can read instead — the
 * registry knows exactly what is LIVE, at the moment this script runs, on
 * `main`, after every PR that could bump it has already merged. Typing it in
 * a PR branch is guessing a number nobody can guarantee is still unclaimed
 * by the time the merge queue gets there.
 *
 * `npm view` is BANNED in this repo (`.claude/rules/derive-never-type.md`):
 * its local cache can serve a version that is no longer the one `latest`
 * (or the target tag) actually points at. This script reads the registry
 * HTTP API directly, with an explicit cache-buster query param AND a
 * `Cache-Control: no-cache` header, exactly like the doctrine's canonical
 * curl recipe.
 *
 * Channel: this package publishes on the `alpha` dist-tag exclusively (see
 * package.json's own version suffix, `-alpha`, and CHANGELOG history) — the
 * next version is a PATCH-level bump of the `alpha` prerelease number, e.g.
 * 0.5.18-alpha -> 0.5.19-alpha. No other bump kind is inferred; a major/minor
 * bump is a deliberate human decision made elsewhere (package.json's own
 * dependencies section, changelog), never guessed by this script.
 *
 * Fail-closed by construction: any registry-fetch failure, any dist-tag
 * this script cannot find, any version string it cannot parse, is a THROWN
 * error — never a silent fallback to a hand-typed or previously-known
 * version. An absence of signal from the registry is never read as "keep
 * the old version and move on".
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_NAME = "@vantageos/mosaic-blocks";
const CHANNEL = "alpha";

// This script WRITES. An unknown flag must therefore never be swallowed as a
// no-op: a caller typing `--dry-run` (a flag that does not exist here) and
// getting a silent full write is the silent-escape-hatch failure in its purest
// form. Unknown argv → loud refusal, before anything is written.
const KNOWN_FLAGS = new Set(["--check"]);
const argv = process.argv.slice(2);
const unknownFlags = argv.filter((a) => !KNOWN_FLAGS.has(a));
if (unknownFlags.length > 0) {
  console.error(
    `derive-next-version: unknown argument(s) ${unknownFlags.join(", ")}. Known flags: ${[...KNOWN_FLAGS].join(", ")} (resolve and print, write nothing). Refusing to run — this script writes package.json + src/version.ts, and a misunderstood flag must not silently become a write.`,
  );
  process.exit(1);
}
const CHECK_ONLY = argv.includes("--check");

// Overridable ONLY so the probe can point the resolver at an unreachable host
// and prove the fail-closed branch actually fails closed. A fail-closed path
// that is never exercised is an intention, not a guarantee.
const REGISTRY_BASE = process.env.MOSAIC_REGISTRY_BASE ?? "https://registry.npmjs.org";

const PACKAGE_JSON_PATH = resolve(ROOT, "package.json");
const VERSION_TS_PATH = resolve(ROOT, "src", "version.ts");

/**
 * Fetch `{dist-tags}` from the npm registry, cache-busted on both the query
 * string AND the request header — `npm view`'s local cache is banned
 * precisely because it can lie about what is actually live.
 * @returns {Promise<Record<string,string>>}
 */
async function fetchDistTags() {
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url = `${REGISTRY_BASE}/${encodeURIComponent(PKG_NAME)}?cb=${cacheBuster}`;
  let res;
  try {
    res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  } catch (err) {
    throw new Error(
      `derive-next-version: registry fetch failed for ${PKG_NAME} — refusing to fall back to a ` +
        `hand-typed or cached version. Network error: ${err.message}`,
    );
  }
  if (res.status === 404) {
    throw new Error(
      `derive-next-version: registry returned 404 for ${PKG_NAME} — either the package name is wrong or it has genuinely never been published. Refusing to guess a version.`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `derive-next-version: registry returned HTTP ${res.status} for ${PKG_NAME} — refusing to fall back to a cached or hand-typed version.`,
    );
  }
  const body = await res.json();
  const distTags = body["dist-tags"];
  if (!distTags || typeof distTags !== "object") {
    throw new Error(
      `derive-next-version: registry response for ${PKG_NAME} has no dist-tags object — cannot resolve what is live. Refusing to guess.`,
    );
  }
  return distTags;
}

/**
 * @param {string} version e.g. "0.5.18-alpha"
 * @returns {{ major: number, minor: number, patch: number, tag: string }}
 */
function parseSemverPrerelease(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)-([a-zA-Z0-9.]+)$/.exec(version);
  if (!match) {
    throw new Error(
      `derive-next-version: could not parse "${version}" as MAJOR.MINOR.PATCH-tag — refusing to guess a next version from an unrecognized shape.`,
    );
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    tag: match[4],
  };
}

/**
 * @param {Record<string,string>} distTags
 * @returns {string} the version currently live on the `alpha` channel
 */
function resolveLiveVersion(distTags) {
  const live = distTags[CHANNEL];
  if (!live) {
    throw new Error(
      `derive-next-version: registry has no "${CHANNEL}" dist-tag for ${PKG_NAME} — cannot derive ` +
        `a next version. Known tags: ${Object.keys(distTags).join(", ") || "(none)"}.`,
    );
  }
  return live;
}

/**
 * @param {string} liveVersion
 * @returns {string} the next patch-bumped prerelease version
 */
function computeNextVersion(liveVersion) {
  const { major, minor, patch, tag } = parseSemverPrerelease(liveVersion);
  return `${major}.${minor}.${patch + 1}-${tag}`;
}

function writePackageJsonVersion(nextVersion) {
  const raw = readFileSync(PACKAGE_JSON_PATH, "utf8");
  const pkg = JSON.parse(raw);
  pkg.version = nextVersion;
  writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function writeVersionTs(nextVersion) {
  writeFileSync(VERSION_TS_PATH, `export const version = "${nextVersion}";\n`, "utf8");
}

async function main() {
  const distTags = await fetchDistTags();
  const liveVersion = resolveLiveVersion(distTags);
  const nextVersion = computeNextVersion(liveVersion);

  if (CHECK_ONLY) {
    console.log(
      `derive-next-version --check: registry live "${CHANNEL}" = ${liveVersion} -> next would be ${nextVersion}. Nothing written.`,
    );
    return;
  }

  writePackageJsonVersion(nextVersion);
  writeVersionTs(nextVersion);

  console.log(
    `derive-next-version: registry live "${CHANNEL}" = ${liveVersion} -> next = ${nextVersion} (written to package.json + src/version.ts).`,
  );

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    writeFileSync(githubOutput, `next_version=${nextVersion}\n`, { flag: "a" });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
