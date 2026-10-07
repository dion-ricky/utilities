import type { ToolMeta } from '../types'

export const jsonFormatter: ToolMeta = {
  slug: 'json-formatter',
  name: 'JSON Formatter',
  description:
    'Pretty-print or minify JSON, with optional recursive key sorting and error positions.',
  category: 'formatter',
  keywords: ['json', 'pretty', 'minify', 'sort keys', 'validate'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
