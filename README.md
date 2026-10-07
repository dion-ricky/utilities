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
| 1 | MVP — 20 daily-driver tools | ⬜ |
| 2–8 | Converters, crypto, generators, … | ⬜ |

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
