# gamma-hardcoded-words-tokens — the no-hardcoded-words guard reads string tokens from a parse

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/hardcoded-words-tokens
**Author:** Gamma — VantageOS Team | 2026-11-23

## Summary

`scripts/no-hardcoded-words-guard.mjs` found strings by pairing quote characters over the raw bundle text. A quote inside a comment is not a delimiter: `// the column's width` paired with the next single quote and formed a fake string (false positive), and a real single-quoted word between two comment apostrophes was never named (false negative). The guard now reads text from the tokens of a `typescript` parse (`createSourceFile`, `ScriptKind.JS`).

## Census (derived from `ts.SyntaxKind`)

- Hides text, never judged: `SingleLineCommentTrivia`, `MultiLineCommentTrivia` (a JSDoc block is one), `RegularExpressionLiteral`.
- Carries text, judged: `StringLiteral`, `NoSubstitutionTemplateLiteral`, `TemplateHead`, `TemplateMiddle`, `TemplateTail`.
- Carries no word: `NumericLiteral`, `BigIntLiteral`.
- Refused if met: `JsxText`, `JsxTextAllWhiteSpaces`, `JSDocCommentTextToken`.

## Changes

- `scripts/no-hardcoded-words-guard.mjs`: `readTokens` replaces the quote-pairing regexes, `findTemplateLiterals` and `maskRegexLiterals`. Refuses (exit 2, `REFUSING TO JUDGE`) on a parse error, an unclassified text-bearing kind, an unread character, or a missing `typescript`. PASS B (text-bearing attribute) now reads the property name from the parse.
- `scripts/tests/probe-no-hardcoded-words-guard.sh`: census check against `ts.SyntaxKind`; 8 MUST_BLOCK token forms, 5 MUST_PASS comment/regex forms, 1 MUST_REFUSE unparseable bundle, all injected after real `var x = require(...)` bundle lines with landing asserted; PASS C member-form words derived (absent from `src`, reserve list, loud refusal if none); the unterminated-string refusal case now expects the parse refusal.
