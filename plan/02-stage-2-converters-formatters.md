# Stage 2 — Encoders, Converters & Formatters (11 tools)

## Goal

Complete the conversion/formatter surface: everything text ⇄ format ⇄ text.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | URL parser | `url-parser` | `URL` + `URLSearchParams` → table; edit params and rebuild URL |
| 2 | Number base converter | `number-base-converter` | `BigInt`; bases 2–36 simultaneously |
| 3 | JSON ⇄ TOML | `json-toml` | `smol-toml` |
| 4 | JSON ⇄ XML | `json-xml` | `fast-xml-parser`; attribute/prefix options |
| 5 | Markdown live viewer | `markdown-viewer` | `marked` + `DOMPurify` sanitized live preview; scroll sync |
| 6 | Data size converter | `data-size-converter` | bits→TB; 1000 vs 1024 base |
| 7 | List converter | `list-converter` | split/join delimiters, trim, dedupe, sort, reverse, regex filter |
| 8 | YAML formatter | `yaml-formatter` | `js-yaml` dump/load; indent, sort keys |
| 9 | JSON viewer | `json-viewer` | collapsible tree, path copy, key/value search |
| 10 | JSON diff | `json-diff` | `jsondiffpatch`; visual + raw delta output |
| 11 | JSONPath / JMESPath query | `json-query` | `jsonpath-plus` first; JMESPath as second mode later |

## Acceptance criteria

- [ ] 11 tools deployed and registered.
- [ ] Round-trip property tests (encode→decode identity) for reversible converters.
- [ ] Large-input guard: warn > ~1 MB payload; textarea stays responsive (debounced compute).
- [ ] Changelog updated; release tagged (e.g. `v0.2.0`).
