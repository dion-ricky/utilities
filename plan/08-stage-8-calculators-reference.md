# Stage 8 — Calculators, Reference & PWA Polish (9 tools + platform)

## Goal

Close out the tool list with calculators and cheatsheets, then harden the platform: installable,
offline, shareable-state, accessible, documented → **v1.0**.

## Tools

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Percentage calculator | `percentage-calculator` | X% of Y, X is what % of Y, % change |
| 2 | Math evaluator | `math-evaluator` | `mathjs` expression parser (no `eval`); functions/constants |
| 3 | Bandwidth calculator | `bandwidth-calculator` | file size ÷ speed → download time; units both bases |
| 4 | ETA calculator | `eta-calculator` | remaining work ÷ rate → finish time |
| 5 | Bitwise calculator | `bitwise-calculator` | AND/OR/XOR/NOT/shifts via `BigInt`; hex/bin/dec displays |
| 6 | ASCII table | `ascii-table` | static dataset; search; copy char/code |
| 7 | Regex cheatsheet | `regex-cheatsheet` | static dataset; grouped, searchable |
| 8 | Git cheatsheet | `git-cheatsheet` | static dataset; categories + search |
| 9 | HTTP headers cheatsheet | `http-headers-cheatsheet` | static dataset; request/response/security headers |

## Platform polish (v1.0 gate)

- [ ] **PWA**: manifest + service worker (precache app shell + tool chunks); installable; fully offline.
- [ ] **Share state via URL**: encode tool input state into the hash query (LZ-compress) with a "Copy link" button per tool.
- [ ] **Keyboard**: ⌘K palette, `/` focus search, `g` then number → stage/category jump; shortcuts help overlay (`?`).
- [ ] **Accessibility audit**: axe sweep, focus management in palette/dialogs, reduced-motion support.
- [ ] **SEO-lite**: per-tool `<title>`/meta description on route change, build-time `sitemap.xml`, `robots.txt`, OG tags.
- [ ] **Docs**: About/Privacy page ("100% client-side, verify in your Network tab"), per-tool one-liners, changelog, MIT license.
- [ ] **Perf budget**: home route < 100 KB gzip; every tool chunk < 150 KB gzip (excluding OCR/PDF chunks, documented exceptions).
- [ ] Lighthouse ≥ 95 across Performance / Accessibility / Best Practices / SEO on home + 3 sample tools.
- [ ] Tag **v1.0.0**, GitHub Release with notes.

## Post-v1 backlog (optional, not scheduled)

- IPv6 subnet calculator · CSV ⇄ markdown table · TOML ⇄ YAML standalone modes ·
  static MAC OUI dataset for vendor lookup · json → Go struct · SQL parameterizer ·
  cron → natural-language heatmap · syntax-highlighted JSONPath explorer upgrades.
