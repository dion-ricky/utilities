import type { ToolMeta } from '../types'

export const sqlFormatter: ToolMeta = {
  slug: 'sql-formatter',
  name: 'SQL Formatter',
  description: 'Pretty-print SQL for many dialects, with indent and keyword-case options.',
  category: 'formatter',
  keywords: ['sql', 'format', 'pretty', 'postgres', 'mysql', 'query'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
