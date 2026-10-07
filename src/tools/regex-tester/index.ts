import type { ToolMeta } from '../types'

export const regexTester: ToolMeta = {
  slug: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test regexes live with match highlighting, groups, and replace preview.',
  category: 'text',
  keywords: ['regexp', 'regex', 'match', 'pattern'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
