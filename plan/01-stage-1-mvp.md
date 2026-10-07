# Stage 1 — MVP (20 tools)

## Goal

Ship the 20 tools developers hit daily. This is the "useful on day one" release.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Base64 encode/decode | `base64-text` | `TextEncoder` + `btoa/atob`; UTF-8 safe; URL-safe variant toggle |
| 2 | URL encoder/decoder | `url-encoder` | `encodeURIComponent` vs `encodeURI` mode switch |
| 3 | JWT decoder | `jwt-decoder` | split + base64url decode header/payload; exp/iat/nbf status badges; **no** signature verification |
| 4 | JSON formatter/validator | `json-formatter` | `JSON.parse`; pretty (2/4/tab), minify, sort keys, error line:col |
| 5 | JSON ⇄ YAML | `json-yaml` | `js-yaml` |
| 6 | JSON ⇄ CSV | `json-csv` | `papaparse`; header row, delimiter, flatten nested (dot notation) |
| 7 | UUID generator | `uuid-generator` | `crypto.randomUUID` (v4); bulk N; uppercase/hyphen options |
| 8 | Hash generator | `hash-text` | **Web Crypto**: SHA-1/256/384/512, all in one output grid |
| 9 | Password generator | `password-generator` | `crypto.getRandomValues`; length, charsets, exclude-ambiguous; entropy readout |
| 10 | Regex tester | `regex-tester` | live `RegExp` matches with capture groups, flags, replace preview; lazy-load full cheatsheet (Stage 8) |
| 11 | Timestamp converter | `timestamp-converter` | epoch s/ms ⇄ ISO 8601, local/UTC, "now" button, date→epoch |
| 12 | Case converter | `case-converter` | camel/snake/kebab/Pascal/CONSTANT/Title/UPPER/lower in one grid |
| 13 | Text diff | `text-diff` | `diff` (jsdiff); unified + side-by-side; ignore case/whitespace options |
| 14 | Lorem ipsum generator | `lorem-ipsum` | paragraphs/sentences/words; "start with Lorem ipsum" toggle |
| 15 | Color converter | `color-converter` | HEX ⇄ RGB ⇄ HSL ⇄ CMYK; alpha; swatch preview |
| 16 | QR code generator | `qr-generator` | `qrcode`; size/margin/ECC; download PNG + SVG |
| 17 | HTML entity encoder | `html-entities` | encode/decode named + numeric refs |
| 18 | SQL formatter | `sql-formatter` | `sql-formatter`; dialect select (Postgres/MySQL/T-SQL/…), indent |
| 19 | Cron explainer | `cron-parser` | `cronstrue` (human description) + `cron-parser` (next N runs); common presets |
| 20 | chmod calculator | `chmod-calculator` | rwx checkbox grid ⇄ octal ⇄ symbolic; recursive flag |

## Acceptance criteria

- [x] All 20 tools live at `#/<slug>` and discoverable via ⌘K.
- [x] Every tool: unit tests for `logic.ts`, copy button, mobile-stacked layout.
- [x] `pnpm build` total < ~300 KB gzip on home route (tool chunks lazy).
- [ ] Deployed and verified on GitHub Pages.
- [x] README lists all 20 tools with descriptions.
