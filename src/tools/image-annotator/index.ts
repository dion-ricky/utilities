import type { ToolMeta } from '../types'

export const imageAnnotator: ToolMeta = {
  slug: 'image-annotator',
  name: 'Image Annotator',
  description: 'Crop, highlight, label, and draw on images — fully offline in your browser.',
  category: 'image',
  keywords: [
    'crop',
    'highlight',
    'annotate',
    'draw',
    'markup',
    'label',
    'pen',
    'screenshot',
    'image-editor',
  ],
  component: () => import('./Tool.vue').then((m) => m.default),
}
