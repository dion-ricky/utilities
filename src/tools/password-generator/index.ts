import type { ToolMeta } from '../types'

export const passwordGenerator: ToolMeta = {
  slug: 'password-generator',
  name: 'Password Generator',
  description: 'Generate cryptographically secure passwords with entropy readout.',
  category: 'generator',
  keywords: ['passphrase', 'random', 'secure', 'strength'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
