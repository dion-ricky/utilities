import type { Component } from 'vue'

export const CATEGORIES = [
  'demo',
  'encoding',
  'converter',
  'formatter',
  'crypto',
  'generator',
  'text',
  'web',
  'network',
  'datetime',
  'css',
  'image',
  'calculator',
  'reference',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  demo: 'Demo',
  encoding: 'Encoding & Decoding',
  converter: 'Converters',
  formatter: 'Formatters & Validators',
  crypto: 'Crypto & Security',
  generator: 'Generators',
  text: 'Text Utilities',
  web: 'Web & HTTP',
  network: 'Network & IP',
  datetime: 'Date & Time',
  css: 'CSS & Design',
  image: 'Images & Files',
  calculator: 'Calculators',
  reference: 'Reference',
}

export interface ToolMeta {
  slug: string
  name: string
  description: string
  category: Category
  keywords: string[]
  component: () => Promise<Component>
}
