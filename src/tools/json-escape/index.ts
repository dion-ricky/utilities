import type { ToolMeta } from '../types'

export const jsonEscape: ToolMeta = {
  slug: 'json-escape',
  name: 'JSON String Escape',
  description:
    'Escape raw text for embedding in a JSON string literal (quotes, backslashes, control chars) — or unescape it back.',
  category: 'encoding',
  keywords: ['json', 'escape', 'unescape', 'quote', 'stringify', 'backslash', 'string'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
