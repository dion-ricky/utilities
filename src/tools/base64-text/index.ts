import type { ToolMeta } from '../types'

export const base64Text: ToolMeta = {
  slug: 'base64-text',
  name: 'Base64 Encode/Decode',
  description:
    'UTF-8 safe Base64 encoder and decoder with support for the URL-safe alphabet and missing padding.',
  category: 'encoding',
  keywords: ['b64', 'atob', 'btoa', 'url-safe', 'base64url'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
