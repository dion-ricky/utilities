import type { ToolMeta } from '../types'

export const loremIpsum: ToolMeta = {
  slug: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  description: 'Generate classic Latin filler text by paragraphs, sentences or words.',
  category: 'generator',
  keywords: ['lorem', 'placeholder', 'filler', 'dummy text'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
