import type { ToolMeta } from '../types'

export const uuidGenerator: ToolMeta = {
  slug: 'uuid-generator',
  name: 'UUID Generator',
  description: 'Generate random RFC 4122 v4 UUIDs, one per line.',
  category: 'generator',
  keywords: ['guid', 'uuid v4', 'identifier'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
