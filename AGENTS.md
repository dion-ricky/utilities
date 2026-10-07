# AGENTS.md

Instructions for AI agents working in this repo.

## Project

Static, 100% client-side developer-tools site ("swiss army knife"). Vite + TypeScript + Vue 3,
hash routing, deployed to GitHub Pages. Roadmap and tool SOP: `plan/README.md`.

## Commands

```sh
pnpm dev          # http://localhost:5173/utilities/ (base path is /utilities/, not /)
pnpm test         # vitest
pnpm lint         # biome check .
pnpm lint:fix     # biome check --write .
pnpm build        # vue-tsc --noEmit && vite build
pnpm gen:tool <slug> --category <category>   # scaffold a new tool from src/tools/_template
```

## Verification rules (important)

- **Do NOT take screenshots.** They consume too many tokens. The human does all visual checks.
- **No visual/layout review.** Do not attempt to judge appearance. Behavior and errors only.
- **DO check for console/page errors** after functional changes. Use headless Chrome via
  `playwright-core` + the system Chrome (`channel: 'chrome'` — never download a browser):

  ```sh
  pnpm add -D playwright-core   # temporary; remove it again before committing
  ```

  ```js
  import { chromium } from 'playwright-core'
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:5199/utilities/', { waitUntil: 'networkidle' })
  // ...drive the flow, then report `errors` (must be empty)
  ```

- Acceptable checks: console/page errors, element presence (`locator.count()`), URL hash,
  `textContent`, numeric geometry (e.g., `getBoundingClientRect()` gaps). Not screenshots.
- Before committing: `pnpm lint && pnpm test && pnpm build` must all pass.

## Gotchas (learned the hard way)

- **Biome cannot see Vue template usage.** For `**/*.vue`, `useImportType`,
  `noUnusedImports`, and `noUnusedVariables` are disabled in `biome.json`. Never re-enable
  them globally — a value import used only in a template (e.g. a component) would get
  rewritten to `import type` and erased by `verbatimModuleSyntax`, breaking the app at
  runtime with no build error. vue-tsc is the authority for template-aware checks.
- **TypeScript is pinned to 5.9.x.** vue-tsc is incompatible with TS 7 (no `lib/tsc` export).
  Don't upgrade until vue-tsc supports it.
- **`@lucide/vue` has no brand icons** (no `Github`). The GitHub mark lives in
  `src/components/GithubIcon.vue`.
- `vite.config.ts` sets `base: '/utilities/'` — must match the GitHub repo name. All routes
  are hash-based (`#/tool-slug`); never add path-based routes.
- Tool logic goes in `logic.ts` (pure, unit-tested); UI in `Tool.vue`; registration in
  `src/tools/index.ts`. See the SOP in `plan/README.md`.

## Constraints (non-negotiable)

- No backend, no runtime network calls, no analytics. All libs bundled at build time.
- Keep the home route under ~100 KB gzip; tool chunks lazy-loaded.
