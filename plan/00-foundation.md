# Stage 0 — Foundation

## Goal

Scaffold the project so every later tool is a ~1-folder drop-in: shell, registry, search, deploy
pipeline. No tools yet — just the platform.

## Stack decision

| Choice | Decision | Rationale |
|---|---|---|
| Build | **Vite 7** | Instant dev, trivial GitHub Pages output |
| Language | **TypeScript (strict)** | Tool logic is testable and refactor-safe |
| UI | **Vue 3** (`<script setup>`) | Small, no JSX ceremony; it-tools proves the model |
| Routing | **Hash router** (`#/slug`) | Zero 404 issues on GitHub Pages project sites |
| Styling | **Plain CSS custom properties** | No framework tax; dark/light via `:root` vars |
| Icons | `lucide` (tree-shaken) | Consistent, tiny |
| Editors | `CodeMirror 6` (lazy-loaded) | Needed by JSON/SQL/regex/diff tools later |
| Tests | **Vitest** | Pure `logic.ts` functions per tool |
| Lint | **Biome** (fallback: ESLint+Prettier) | One fast tool |
| Pkg mgr | pnpm | Fast, strict |

Alternatives noted: Astro (SSG/islands) if SEO-per-tool-page becomes a priority — revisit before
Stage 1, not after.

## Architecture

### Tool registry (`src/tools/index.ts`)

```ts
export interface ToolMeta {
  slug: string                       // 'json-formatter' → route #/json-formatter
  name: string                       // 'JSON Formatter'
  description: string
  category: Category                 // 'encoding' | 'converter' | 'formatter' | ...
  keywords: string[]                 // powers ⌘K search
  component: () => Promise<Component> // lazy import
}
export const toolsByCategory: Record<Category, ToolMeta[]>
```

- Home page renders the registry grouped by category (card grid).
- ⌘K command palette searches `name + keywords + category`.
- Favorites (localStorage) pinned to top; recents list.

### Repo layout

```
src/
  main.ts / App.vue / router.ts        # hash router, lazy tool chunks
  shell/                               # header, palette (⌘K), sidebar, footer
  components/                          # CopyButton, CodeEditor, TwoPane, Field,
                                       # FileDrop, Select, Toggle, ResultBox
  composables/                         # useCopy, useLocalStorage, useDebounce, useTheme
  tools/
    index.ts                           # registry
    _template/                         # copy-me starter (logic.ts, Tool.vue, spec)
    <slug>/                            # one folder per tool
  data/                                # static datasets (http codes, mime, ascii, emoji)
  assets/
```

### Shared UI contracts

- Every result panel has a **Copy** button; inputs keep state in the URL query where useful.
- Layout: `TwoPane` (input left, output right) collapses to stacked on mobile.
- All heavy libs (`CodeMirror`, `marked`, …) are **lazy imports** inside tool chunks.

## CI / deploy

- GitHub Actions workflow on push to `main`:
  1. pnpm install (cached) → lint → test → `vite build` (`base: '/<repo-name>/'`)
  2. Upload artifact → `actions/deploy-pages`
- PR previews: build-only check (Pages preview optional).
- Badges in README (build, deploy, license MIT).

## Definition of done (Stage 0)

- [ ] `pnpm dev` runs; `pnpm test`, `pnpm build`, `pnpm lint` green.
- [ ] Site reachable at `https://<user>.github.io/<repo>/` with hash routing working.
- [ ] ⌘K palette, favorites, dark mode, copy buttons all functional (demo tool = template).
- [ ] One template-based demo tool ships to prove the registry end-to-end.
- [ ] Lighthouse (home page): Performance & Accessibility ≥ 95.
