import type { ToolMeta } from '../types'

export const jsonCsv: ToolMeta = {
  slug: 'json-csv',
  name: 'JSON ⇄ CSV',
  description:
    'Convert between JSON arrays of objects and CSV, with delimiter and flattening options.',
  category: 'converter',
  keywords: ['json', 'csv', 'convert', 'delimited', 'tsv', 'spreadsheet'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
