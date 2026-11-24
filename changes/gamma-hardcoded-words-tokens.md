# gamma-hardcoded-words-tokens — the no-hardcoded-words guard reads string tokens from a parse

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/hardcoded-words-tokens
**Author:** Gamma — VantageOS Team | 2026-11-24

## Summary

`scripts/no-hardcoded-words-guard.mjs` found strings by pairing quote characters over the raw bundle text. A quote inside a comment is not a delimiter: `// the column's width` paired with the next single quote and formed a fake string (false positive), and a real single-quoted word between two comment apostrophes was never named (false negative). The guard now reads text from the tokens of a `typescript` parse (`createSourceFile`, `ScriptKind.JS`).

## Census (derived from `ts.SyntaxKind`)

- Hides text, never judged: `SingleLineCommentTrivia`, `MultiLineCommentTrivia` (a JSDoc block is one), `RegularExpressionLiteral`.
- Carries text, judged: `StringLiteral`, `NoSubstitutionTemplateLiteral`, `TemplateHead`, `TemplateMiddle`, `TemplateTail`.
- Carries no word: `NumericLiteral`, `BigIntLiteral`.
- Refused if met: `JsxText`, `JsxTextAllWhiteSpaces`, `JSDocCommentTextToken`.

## Changes

- `scripts/no-hardcoded-words-guard.mjs`: `readTokens` replaces the quote-pairing regexes, `findTemplateLiterals` and `maskRegexLiterals`. Refuses (exit 2, `REFUSING TO JUDGE`) on a parse error, an unclassified text-bearing kind, an unread character, or a missing `typescript`. PASS B (text-bearing attribute) now reads the property name from the parse.
- `scripts/tests/probe-no-hardcoded-words-guard.sh`: comment-form section (one `//`, one `/* */`, one JSDoc apostrophe beside a new single-quoted string, on three real component files derived by rule, built, landing asserted in the bundle, no offender added); census check against `ts.SyntaxKind`; 7 MUST_BLOCK token forms and 5 MUST_PASS comment/regex forms injected after real `var x = require(...)` bundle lines with landing asserted; MUST_REFUSE for an unparseable bundle and a `JsxText` token. Subjects are `zq` nonces proven absent by `subject_sites`. The unterminated-string refusal case now expects the parse refusal.
