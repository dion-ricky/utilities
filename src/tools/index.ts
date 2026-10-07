import { demoEcho } from './demo-echo'
import type { Category, ToolMeta } from './types'
import { CATEGORIES, CATEGORY_LABELS } from './types'

/**
 * Tool registry — the single source of truth for the home page, ⌘K palette,
 * and routing. Add a tool here after generating it with `pnpm gen:tool`.
 */
export const tools: ToolMeta[] = [demoEcho]

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
