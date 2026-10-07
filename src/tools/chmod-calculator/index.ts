import type { ToolMeta } from '../types'

export const chmodCalculator: ToolMeta = {
  slug: 'chmod-calculator',
  name: 'Chmod Calculator',
  description: 'Build file permissions with a grid and get octal, symbolic, and command output.',
  category: 'calculator',
  keywords: ['permissions', 'unix', 'octal', 'linux'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
