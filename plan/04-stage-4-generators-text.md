# Stage 4 — Generators & Text Utilities (19 tools)

## Goal

The "generate it for me" tools plus a complete text-manipulation set.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Mock/fake data generator | `faker-data` | `@faker-js/faker` (locale sub-import); schema: N rows × selected fields; JSON/CSV/SQL export |
| 2 | QR code reader | `qr-reader` | `jsQR` + canvas decode of uploaded/dropped image |
| 3 | Barcode generator | `barcode-generator` | `jsbarcode` (CODE128/EAN13…); PNG/SVG download |
| 4 | SVG placeholder generator | `svg-placeholder` | string templating; size/colors/text; URL or file |
| 5 | Favicon generator | `favicon-generator` | canvas → 16/32/48… multi-size PNG set + ICO; ZIP download |
| 6 | Meta tag generator | `meta-tag-generator` | OG/Twitter/SEO fields → live preview + copyable `<head>` block |
| 7 | robots.txt generator | `robots-txt-generator` | form → robots.txt; common crawler presets |
| 8 | .gitignore generator | `gitignore-generator` | static template DB (Node/Python/Go/macOS/…), merge & preview |
| 9 | Slug generator | `slug-generator` | unicode-aware transliteration; separator/case options |
| 10 | Git commit helper | `git-commit-helper` | conventional-commits builder: type/scope/breaking/body → message |
| 11 | Text statistics | `text-statistics` | words/chars/lines/sentences, reading time, top frequencies |
| 12 | Duplicate line remover | `line-tools` | dedupe (case-insensitive opt), sort, shuffle, reverse, number lines |
| 13 | Find & replace | `find-replace` | literal or regex, case flags, batch replace preview |
| 14 | Text cleaner | `text-cleaner` | strip HTML tags, remove line breaks/extra spaces, trim lines |
| 15 | NATO alphabet converter | `nato-alphabet` | A→Alfa table; phonetic output |
| 16 | Emoji picker | `emoji-picker` | `emoji-mart` + static data chunk (lazy); copy single/bulk |
| 17 | Numeronym generator | `numeronym` | i18n/k8s style middle-length contraction |
| 18 | String obfuscator | `string-obfuscator` | zero-width chars, escape tricks, backslash encode |
| 19 | ASCII art banner | `ascii-art` | `figlet`; font select; fonts lazy-loaded |

## Acceptance criteria

- [ ] 19 tools deployed; heavy data chunks (emoji, figlet fonts, faker locales) lazy-loaded.
- [ ] `favicon-generator` produces a working .ico (verify by setting it as site favicon in dev).
- [ ] faker output validates against selected export format (JSON/CSV round-trip).
- [ ] Release tagged.
