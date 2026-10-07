import type { ToolMeta } from '../types'

export const cronParser: ToolMeta = {
  slug: 'cron-parser',
  name: 'Cron Parser',
  description: 'Explain cron expressions in plain English and list their next run times.',
  category: 'datetime',
  keywords: ['crontab', 'schedule', 'job'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
