import type { ToolMeta } from '../types'

export const hashText: ToolMeta = {
  slug: 'hash-text',
  name: 'Hash Text',
  description: 'Compute SHA-1/256/384/512 digests of any text.',
  category: 'crypto',
  keywords: ['sha1', 'sha256', 'sha384', 'sha512', 'digest', 'checksum'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
