import type { ToolMeta } from '../types'

export const jsonYaml: ToolMeta = {
  slug: 'json-yaml',
  name: 'JSON ⇄ YAML',
  description: 'Convert between JSON and YAML in either direction.',
  category: 'converter',
  keywords: ['json', 'yaml', 'convert', 'yaml2json', 'json2yaml'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
