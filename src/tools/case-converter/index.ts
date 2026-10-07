import type { ToolMeta } from '../types'

export const caseConverter: ToolMeta = {
  slug: 'case-converter',
  name: 'Case Converter',
  description: 'Convert text to camelCase, snake_case, kebab-case, CONSTANT_CASE and more at once.',
  category: 'text',
  keywords: ['camelcase', 'snake', 'kebab', 'naming'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
