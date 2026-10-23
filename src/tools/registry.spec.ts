import { describe, expect, it } from 'vitest'
import { getTool, searchTools, tools, toolsByCategory } from './index'
import { CATEGORIES } from './types'

describe('tool registry', () => {
  it('has at least one tool', () => {
    expect(tools.length).toBeGreaterThan(0)
  })

  it('has unique slugs', () => {
    const slugs = tools.map((tool) => tool.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('only uses valid categories', () => {
    for (const tool of tools) {
      expect(CATEGORIES).toContain(tool.category)
    }
  })

  it('groups every tool into a non-empty category', () => {
    const grouped = toolsByCategory.flatMap((group) => group.tools)
    expect(grouped.length).toBe(tools.length)
    for (const group of toolsByCategory) {
      expect(group.tools.length).toBeGreaterThan(0)
    }
  })

  it('finds tools by slug', () => {
    expect(getTool('base64-text')?.slug).toBe('base64-text')
    expect(getTool('does-not-exist')).toBeUndefined()
  })

  it('registers the todo list under productivity', () => {
    expect(getTool('todo-list')?.category).toBe('productivity')
    const group = toolsByCategory.find((entry) => entry.category === 'productivity')
    expect(group?.tools.map((tool) => tool.slug)).toContain('todo-list')
  })

  it('searches by name, slug and keywords', () => {
    const results = searchTools('uuid')
    expect(results.map((tool) => tool.slug)).toContain('uuid-generator')
    expect(searchTools('todo').map((tool) => tool.slug)).toContain('todo-list')
    expect(searchTools('zzz-no-match-zzz')).toHaveLength(0)
  })
})
