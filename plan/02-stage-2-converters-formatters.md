# Stage 2 — Encoders, Converters & Formatters (20 tools)

## Goal

Complete the conversion/formatter surface: everything text ⇄ format ⇄ text.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Base64 file ⇄ data URI | `base64-file` | FileReader, drag&drop, reverse (data URI → file download) |
| 2 | Unicode escaper | `unicode-escaper` | `\uXXXX`, `\xNN`, decimal NCR modes |
| 3 | Text ⇄ binary/hex/dec/octal | `text-binary` | per-char, UTF-8 or ASCII codec; includes decimal→ASCII |
| 4 | Morse code translator | `morse-translator` | ITU table; dot/dash/slash symbols; optional WebAudio playback |
| 5 | String escaper/unescaper | `string-escaper` | JS/JSON string escaping; quote style; safe unescape |
| 6 | URL parser | `url-parser` | `URL` + `URLSearchParams` → table; edit params and rebuild URL |
| 7 | Number base converter | `number-base-converter` | `BigInt`; bases 2–36 simultaneously |
| 8 | JSON ⇄ TOML | `json-toml` | `smol-toml` |
| 9 | JSON ⇄ XML | `json-xml` | `fast-xml-parser`; attribute/prefix options |
| 10 | Markdown → HTML | `markdown-html` | `marked` + `DOMPurify` sanitize; copy/download |
| 11 | Data size converter | `data-size-converter` | bits→TB; 1000 vs 1024 base |
| 12 | List converter | `list-converter` | split/join delimiters, trim, dedupe, sort, reverse, regex filter |
| 13 | XML formatter | `xml-formatter` | `fast-xml-parser` pretty/minify |
| 14 | YAML formatter | `yaml-formatter` | `js-yaml` dump/load; indent, sort keys |
| 15 | HTML/CSS beautifier | `markup-beautifier` | `js-beautify` (HTML + CSS modes) |
| 16 | JS beautifier/minifier | `js-beautifier` | `js-beautify` + `terser` (browser build); both directions |
| 17 | JSON viewer | `json-viewer` | collapsible tree, path copy, key/value search |
| 18 | JSON diff | `json-diff` | `jsondiffpatch`; visual + raw delta output |
| 19 | JSON → TypeScript | `json-to-ts` | hand-rolled interface generator (option: `quicktype-core` WASM later) |
| 20 | JSONPath / JMESPath query | `json-query` | `jsonpath-plus` first; JMESPath as second mode later |

## Acceptance criteria

- [ ] 20 tools deployed and registered.
- [ ] Round-trip property tests (encode→decode identity) for reversible converters.
- [ ] Large-input guard: warn > ~1 MB payload; textarea stays responsive (debounced compute).
- [ ] Changelog updated; release tagged (e.g. `v0.2.0`).
