# gamma-scanner-tokens-shared — three more quote scanners read parse tokens through one shared reader

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/scanner-tokens-shared
**Task:** k17dchnw3f2fqgjeqw10mn9b9h8jvfcm
**Author:** Gamma — VantageOS Team | 2026-11-24

## Summary

`scripts/theme-tokens-declared-guard.mjs` (FORM 1 and FORM 2) and `maskCommentsAndStrings` in `scripts/docs-counts-shared.mjs` found strings by pairing quote characters. A quote inside a comment or a regex literal paired with the next quote below it and formed a fake string over real code: a real string after it was never read (an undeclared theme token unnamed; an `import` / `export` line masked away, so its statement and package vanished). They now read the tokens of a TypeScript parse through `scripts/source-tokens-shared.mjs`, the reader moved out of `scripts/no-hardcoded-words-guard.mjs` (behaviour unchanged).

## Census (derived from `ts.SyntaxKind`, in the shared module's header)

- Text read: `StringLiteral`, `NoSubstitutionTemplateLiteral`, and the static parts of a template expression or template literal type (`TemplateHead` / `TemplateMiddle` / `TemplateTail`).
- Hides text: comments (trivia; a JSDoc block is one) and `RegularExpressionLiteral`.
- No word: `NumericLiteral`, `BigIntLiteral`.
- Refused unless the caller declares it ignorable: `JsxText`, `JsxTextAllWhiteSpaces`, `JSDocCommentTextToken`, `NonTextFileMarkerTrivia`. The two scanners that read TSX source declare the two JSX text kinds ignorable; the bundle guard does not.

## Changes

- `scripts/source-tokens-shared.mjs` (+ `.d.mts`): `readSourceTokens`, `blankRanges`, `loadTypeScript`, `deriveUnclassifiedTextKinds`, `SourceReadRefusal`, `JSX_TEXT_KINDS`.
- `scripts/no-hardcoded-words-guard.mjs`: `readTokens` keeps only what is specific to the guard (CSS at-rule templates, text-bearing attributes).
- `scripts/theme-tokens-declared-guard.mjs`: both scanners rewritten on the reader; parse failure refuses (exit 2).
- `scripts/docs-counts-shared.mjs` `maskCommentsAndStrings(src, keepStrings, fileName)`; `scripts/registry-json-derive.mjs` passes the file name.
- Tests and probes: see CHANGELOG.
