import type { ToolMeta } from '../types'

export const __PASCAL__: ToolMeta = {
  slug: '__SLUG__',
  name: '__TOOL_NAME__',
  description: 'TODO: one-line description shown on the card and palette.',
  category: '__CATEGORY__' as ToolMeta['category'],
  keywords: [],
  component: () => import('./Tool.vue').then((m) => m.default),
}
