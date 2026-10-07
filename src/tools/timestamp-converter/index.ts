import type { ToolMeta } from '../types'

export const timestampConverter: ToolMeta = {
  slug: 'timestamp-converter',
  name: 'Timestamp Converter',
  description: 'Convert epoch timestamps to ISO/local/relative time — and back.',
  category: 'datetime',
  keywords: ['epoch', 'unix', 'time', 'date'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
