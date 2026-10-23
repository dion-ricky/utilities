/**
 * Pure todo list logic. Ids and timestamps are injected so this module stays
 * free of DOM, storage and clock access.
 */

export type TodoFilter = 'all' | 'active' | 'completed'

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: number
  completedAt: number | null
}

export const STORAGE_KEY = 'dsk.todos'

/** Persisted expand/collapse state of the completed section. */
export const COMPLETED_OPEN_STORAGE_KEY = 'dsk.todos.completedOpen'

/** Build a new todo, or `null` when the text is blank. */
export function createTodo(text: string, id: string, now: number): TodoItem | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return { id, text: trimmed, done: false, createdAt: now, completedAt: null }
}

/** Append a todo; blank text returns the same array reference (no write). */
export function addTodo(items: TodoItem[], text: string, id: string, now: number): TodoItem[] {
  const todo = createTodo(text, id, now)
  if (!todo) return items
  return [...items, todo]
}

/** Flip completion state; unknown id returns the same array reference. */
export function toggleTodo(items: TodoItem[], id: string, now: number): TodoItem[] {
  if (!items.some((item) => item.id === id)) return items
  return items.map((item) =>
    item.id === id ? { ...item, done: !item.done, completedAt: item.done ? null : now } : item,
  )
}

/** Rename a todo; blank/unchanged text or unknown id returns the same array reference. */
export function updateTodoText(items: TodoItem[], id: string, text: string): TodoItem[] {
  const trimmed = text.trim()
  if (!trimmed) return items
  const current = items.find((item) => item.id === id)
  if (!current || current.text === trimmed) return items
  return items.map((item) => (item.id === id ? { ...item, text: trimmed } : item))
}

/** Remove one todo; unknown id returns the same array reference. */
export function removeTodo(items: TodoItem[], id: string): TodoItem[] {
  const next = items.filter((item) => item.id !== id)
  return next.length === items.length ? items : next
}

/** Drop every completed todo; nothing completed returns the same array reference. */
export function clearCompleted(items: TodoItem[]): TodoItem[] {
  const next = items.filter((item) => !item.done)
  return next.length === items.length ? items : next
}

/** Select the visible todos; `all` keeps insertion order. */
export function filterTodos(items: TodoItem[], filter: TodoFilter): TodoItem[] {
  if (filter === 'active') return items.filter((item) => !item.done)
  if (filter === 'completed') return items.filter((item) => item.done)
  return items
}

export interface TodoSections {
  active: TodoItem[]
  completed: TodoItem[]
}

/** Partition by completion, preserving relative order. Never mutates. */
export function splitTodos(items: TodoItem[]): TodoSections {
  return { active: filterTodos(items, 'active'), completed: filterTodos(items, 'completed') }
}

/**
 * Move `sourceId` before/after `targetId`. Returns the same array reference when
 * either id is unknown, both ids match, or the resulting id order is unchanged.
 */
export function reorderTodos(
  items: TodoItem[],
  sourceId: string,
  targetId: string,
  place: 'before' | 'after',
): TodoItem[] {
  if (sourceId === targetId) return items
  const source = items.find((item) => item.id === sourceId)
  if (!source) return items
  if (!items.some((item) => item.id === targetId)) return items

  const rest = items.filter((item) => item.id !== sourceId)
  const targetIndex = rest.findIndex((item) => item.id === targetId)
  const insertAt = place === 'before' ? targetIndex : targetIndex + 1
  const next = [...rest.slice(0, insertAt), source, ...rest.slice(insertAt)]

  const unchanged = next.every((item, index) => item.id === items[index]?.id)
  return unchanged ? items : next
}

/** Count total, active and completed todos. */
export function countTodos(items: TodoItem[]): {
  total: number
  active: number
  completed: number
} {
  let completed = 0
  for (const item of items) {
    if (item.done) completed++
  }
  return { total: items.length, active: items.length - completed, completed }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Sanitize persisted data: never throws, drops invalid entries and duplicate
 * ids, and coerces every remaining field to the `TodoItem` shape.
 */
export function normalizeTodos(raw: unknown): TodoItem[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: TodoItem[] = []
  for (const entry of raw) {
    if (!isRecord(entry)) continue
    const id = entry.id
    const text = entry.text
    if (typeof id !== 'string' || !id) continue
    if (typeof text !== 'string' || !text.trim()) continue
    if (seen.has(id)) continue
    seen.add(id)
    const done = entry.done === true
    const createdAt = finiteNumber(entry.createdAt) ?? 0
    const completedAt = done ? finiteNumber(entry.completedAt) : null
    result.push({ id, text: text.trim(), done, createdAt, completedAt })
  }
  return result
}
