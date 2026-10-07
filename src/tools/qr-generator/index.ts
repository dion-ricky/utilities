import type { ToolMeta } from '../types'

export const qrGenerator: ToolMeta = {
  slug: 'qr-generator',
  name: 'QR Code Generator',
  description: 'Create QR codes from text or URLs as PNG or SVG.',
  category: 'generator',
  keywords: ['qr', 'barcode', 'qrcode'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
