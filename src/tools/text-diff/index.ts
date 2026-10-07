import type { ToolMeta } from '../types'

export const textDiff: ToolMeta = {
  slug: 'text-diff',
  name: 'Text Diff',
  description: 'Compare two texts line-by-line or word-by-word, with case/whitespace options.',
  category: 'text',
  keywords: ['diff', 'compare', 'changes', 'unified', 'text'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
