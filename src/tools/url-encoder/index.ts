import type { ToolMeta } from '../types'

export const urlEncoder: ToolMeta = {
  slug: 'url-encoder',
  name: 'URL Encode/Decode',
  description:
    'Percent-encode and decode text or whole URLs, choosing between component escaping and URI-preserving mode.',
  category: 'encoding',
  keywords: ['percent', 'encodeURIComponent', 'encodeURI', 'query', 'escape'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
