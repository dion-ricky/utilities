import type { ToolMeta } from '../types'

export const colorConverter: ToolMeta = {
  slug: 'color-converter',
  name: 'Color Converter',
  description:
    'Convert colors between HEX, RGB, HSL, and CMYK with a native picker and alpha support.',
  category: 'converter',
  keywords: ['hex', 'rgb', 'hsl', 'cmyk', 'picker', 'swatch'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
