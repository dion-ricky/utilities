# Dev Swiss Army Knife

A swiss army knife of developer tools — **100% client-side**. Static site, no backend, no
analytics: nothing you paste (JWTs, configs, tokens) ever leaves your browser. Verify it
yourself in the Network tab.

Built with Vite + TypeScript + Vue 3. Deployed to GitHub Pages:
**https://dion-ricky.github.io/utilities/**

> Roadmap: see [plan/README.md](plan/README.md) — 120 tools across 8 stages.

## Status

| Stage | Theme | State |
|---|---|---|
| 0 | Foundation (shell, registry, ⌘K, deploy) | ✅ |
| 1 | MVP — 20 daily-driver tools | ✅ |
| 2–8 | Converters, crypto, generators, … | ⬜ |

## Tools

### Encoding & Decoding
- **Base64 Encode/Decode** (`#/base64-text`) — UTF-8 safe, URL-safe variant
- **URL Encode/Decode** (`#/url-encoder`) — `encodeURIComponent` / `encodeURI` modes
- **HTML Entities** (`#/html-entities`) — encode/decode named + numeric refs

### Converters
- **Color Converter** (`#/color-converter`) — HEX ⇄ RGB ⇄ HSL ⇄ CMYK, alpha, swatch

### Formatters & Validators
- **JSON Formatter** (`#/json-formatter`) — pretty/minify, sort keys, error line:col
- **SQL Formatter** (`#/sql-formatter`) — 7 dialects, indent options

### Converters (data)
- **JSON ⇄ YAML** (`#/json-yaml`)
- **JSON ⇄ CSV** (`#/json-csv`) — delimiter, header row, dot-notation flattening

### Crypto & Security
- **JWT Decoder** (`#/jwt-decoder`) — header/payload decode, exp/iat/nbf badges, no signature verification
- **Hash Text** (`#/hash-text`) — SHA-1/256/384/512 via Web Crypto

### Generators
- **UUID Generator** (`#/uuid-generator`) — v4, bulk, uppercase/no-hyphen options
- **Password Generator** (`#/password-generator`) — charsets, exclude-ambiguous, entropy readout
- **QR Code Generator** (`#/qr-generator`) — size/margin/ECC, PNG + SVG download
- **Lorem Ipsum Generator** (`#/lorem-ipsum`) — paragraphs/sentences/words

### Text Utilities
- **Text Diff** (`#/text-diff`) — word/line level, ignore case/whitespace, side-by-side
- **Case Converter** (`#/case-converter`) — 8 cases in one grid
- **Regex Tester** (`#/regex-tester`) — live matches, capture groups, replace preview

### Date & Time
- **Timestamp Converter** (`#/timestamp-converter`) — epoch s/ms ⇄ ISO, local/UTC, relative
- **Cron Parser** (`#/cron-parser`) — human description + next N runs, presets

### Calculators
- **Chmod Calculator** (`#/chmod-calculator`) — rwx grid ⇄ octal ⇄ symbolic, special bits

## Development

```sh
pnpm install
pnpm dev        # http://localhost:5173/utilities/
pnpm test       # vitest
pnpm lint       # biome
pnpm build      # type-check + production build into dist/
pnpm preview    # serve dist/
```

## Adding a tool

```sh
pnpm gen:tool my-tool --category encoding
```

Then implement the logic in `src/tools/my-tool/logic.ts`, build the UI in `Tool.vue`, and
register it in `src/tools/index.ts`. Full SOP: [plan/README.md](plan/README.md).

## Deployment

Push to `main` → GitHub Actions lints, tests, builds, and deploys to Pages.

One-time repo setting: **Settings → Pages → Source: GitHub Actions**.

## License

[MIT](LICENSE)
