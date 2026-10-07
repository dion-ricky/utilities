# Dev Swiss Army Knife — Build Plan

A static, backend-free developer utilities site ("swiss army knife" for devs), hosted on GitHub Pages.
Every tool runs 100% in the browser: no server calls, no data leaving the device. Inspired by the
tool sets of it-tools, CyberChef-style sites, ZeroServer.tools, Tooliest, and UtiliTools.

## Constraints (non-negotiable)

- Static site only — no backend, no runtime API calls.
- All libraries vendored/bundled at build time (no runtime CDN dependency).
- Hosted on GitHub Pages (project site), deploy via GitHub Actions.
- Works fully offline after first load (PWA in final stage).
- Privacy-first: suitable for pasting JWTs, configs, internal payloads.

## Stack (plan of record)

- **Vite + TypeScript + Vue 3** (`<script setup>`), plain CSS with custom properties (dark/light).
- **Hash routing** (`#/tool-slug`) — avoids GitHub Pages 404 rewrite problems entirely.
- **Tool registry pattern** — every tool is a self-contained folder + one registry entry.
- Tests: Vitest (pure logic functions per tool). Lint: Biome (or ESLint+Prettier).
- Alternative stack (if user prefers SSG/SEO-first): Astro with islands. Decision made in Stage 0.

See `00-foundation.md` for architecture, repo layout, and CI.

## Stages

| Stage | File | Theme | Tools |
|---|---|---|---|
| 0 | [00-foundation.md](00-foundation.md) | Shell, registry, search, CI, deploy | — |
| 1 | [01-stage-1-mvp.md](01-stage-1-mvp.md) | MVP — the 20 daily-driver tools | 20 |
| 2 | [02-stage-2-converters-formatters.md](02-stage-2-converters-formatters.md) | Encoders, converters, formatters | 20 |
| 3 | [03-stage-3-crypto-security.md](03-stage-3-crypto-security.md) | Crypto & security suite | 13 |
| 4 | [04-stage-4-generators-text.md](04-stage-4-generators-text.md) | Generators & text utilities | 19 |
| 5 | [05-stage-5-web-network-datetime.md](05-stage-5-web-network-datetime.md) | Web/HTTP, network, date & time | 19 |
| 6 | [06-stage-6-css-design.md](06-stage-6-css-design.md) | CSS & design tools | 13 |
| 7 | [07-stage-7-images-files.md](07-stage-7-images-files.md) | Images & files (Canvas/WASM) | 7 |
| 8 | [08-stage-8-calculators-reference.md](08-stage-8-calculators-reference.md) | Calculators, reference, PWA polish | 9 |

**Total: 120 tools** across 8 stages after the foundation.

## Progress

- [x] Stage 0 — Foundation
- [x] Stage 1 — MVP (20 tools)
- [ ] Stage 2 — Converters & formatters (20)
- [ ] Stage 3 — Crypto & security (13)
- [ ] Stage 4 — Generators & text (19)
- [ ] Stage 5 — Web, network, date & time (19)
- [ ] Stage 6 — CSS & design (13)
- [ ] Stage 7 — Images & files (7)
- [ ] Stage 8 — Calculators, reference, PWA (9)

## Excluded (cannot honor "no backend")

Currency exchange rates · WHOIS/DNS lookups · IP geolocation · MAC OUI vendor lookup
(unless we ship a static offline OUI dataset) · page-speed/SEO crawlers · URL shorteners ·
anything that must call an external API at runtime.

## SOP: adding a tool (used by every stage)

1. Copy `src/tools/_template/` → `src/tools/<slug>/`.
2. Implement pure logic in `logic.ts` + unit tests in `logic.spec.ts`.
3. Build `Tool.vue` UI from shared components (`TwoPane`, `CopyButton`, `CodeEditor`, `Field`).
4. Register in `src/tools/index.ts` (name, category, keywords, lazy component).
5. `pnpm test && pnpm build`, verify on the Pages preview, merge.
6. Each stage ends with: deploy check on GitHub Pages, README/changelog update, optional tag.
