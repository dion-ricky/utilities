import { base64Text } from './base64-text'
import { caseConverter } from './case-converter'
import { chmodCalculator } from './chmod-calculator'
import { colorConverter } from './color-converter'
import { cronParser } from './cron-parser'
import { demoEcho } from './demo-echo'
import { hashText } from './hash-text'
import { htmlEntities } from './html-entities'
import { jsonCsv } from './json-csv'
import { jsonFormatter } from './json-formatter'
import { jsonYaml } from './json-yaml'
import { jwtDecoder } from './jwt-decoder'
import { loremIpsum } from './lorem-ipsum'
import { passwordGenerator } from './password-generator'
import { qrGenerator } from './qr-generator'
import { regexTester } from './regex-tester'
import { sqlFormatter } from './sql-formatter'
import { textDiff } from './text-diff'
import { timestampConverter } from './timestamp-converter'
import type { Category, ToolMeta } from './types'
import { CATEGORIES, CATEGORY_LABELS } from './types'
import { urlEncoder } from './url-encoder'
import { uuidGenerator } from './uuid-generator'

/**
 * Tool registry — the single source of truth for the home page, ⌘K palette,
 * and routing. Add a tool here after generating it with `pnpm gen:tool`.
 */
export const tools: ToolMeta[] = [
  base64Text,
  urlEncoder,
  jwtDecoder,
  htmlEntities,
  colorConverter,
  jsonFormatter,
  jsonYaml,
  jsonCsv,
  sqlFormatter,
  textDiff,
  uuidGenerator,
  hashText,
  passwordGenerator,
  qrGenerator,
  loremIpsum,
  regexTester,
  timestampConverter,
  caseConverter,
  cronParser,
  chmodCalculator,
  demoEcho,
]

export interface ToolGroup {
  category: Category
  label: string
  tools: ToolMeta[]
}

export const toolsByCategory: ToolGroup[] = CATEGORIES.map((category) => ({
  category,
  label: CATEGORY_LABELS[category],
  tools: tools.filter((tool) => tool.category === category),
})).filter((group) => group.tools.length > 0)

export function getTool(slug: string): ToolMeta | undefined {
  return tools.find((tool) => tool.slug === slug)
}

export function searchTools(query: string, limit = 30): ToolMeta[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tools.slice(0, limit)
  return tools
    .filter((tool) =>
      `${tool.name} ${tool.slug} ${tool.description} ${tool.category} ${tool.keywords.join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
    .slice(0, limit)
}
