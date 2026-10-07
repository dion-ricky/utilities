import type { ToolMeta } from '../types'

export const htmlEntities: ToolMeta = {
  slug: 'html-entities',
  name: 'HTML Entities',
  description:
    'Escape and unescape HTML entities — named refs for & < > " plus common symbols and optional numeric refs.',
  category: 'encoding',
  keywords: ['escape', 'unescape', 'amp', 'nbsp', 'entity', 'special characters'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
