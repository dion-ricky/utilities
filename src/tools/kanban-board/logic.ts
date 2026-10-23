/**
 * Pure kanban logic. Ids and timestamps are injected so this module stays free
 * of DOM, storage and clock access.
 */

export const STATUSES = ['todo', 'in-progress', 'done'] as const

export type KanbanStatus = (typeof STATUSES)[number]

export interface KanbanTask {
  id: string
  text: string
  status: KanbanStatus
  createdAt: number
  completedAt: number | null
}

export const STORAGE_KEY = 'dsk.kanban.tasks'

export const STATUS_LABELS: Record<KanbanStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
}

/** Build a new task, or `null` when the text is blank. */
export function createTask(
  text: string,
  status: KanbanStatus,
  id: string,
  now: number,
): KanbanTask | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return {
    id,
    text: trimmed,
    status,
    createdAt: now,
    completedAt: status === 'done' ? now : null,
  }
}

/** Append a task; blank text returns the same array reference (no write). */
export function addTask(
  tasks: KanbanTask[],
  text: string,
  status: KanbanStatus,
  id: string,
  now: number,
): KanbanTask[] {
  const task = createTask(text, status, id, now)
  if (!task) return tasks
  return [...tasks, task]
}

/** Rename a task; blank/unchanged text or unknown id returns the same array reference. */
export function updateTaskText(tasks: KanbanTask[], id: string, text: string): KanbanTask[] {
  const trimmed = text.trim()
  if (!trimmed) return tasks
  const current = tasks.find((task) => task.id === id)
  if (!current || current.text === trimmed) return tasks
  return tasks.map((task) => (task.id === id ? { ...task, text: trimmed } : task))
}

/** Remove one task; unknown id returns the same array reference. */
export function removeTask(tasks: KanbanTask[], id: string): KanbanTask[] {
  const next = tasks.filter((task) => task.id !== id)
  return next.length === tasks.length ? tasks : next
}

/** Drop every done task; nothing done returns the same array reference. */
export function clearDone(tasks: KanbanTask[]): KanbanTask[] {
  const next = tasks.filter((task) => task.status !== 'done')
  return next.length === tasks.length ? tasks : next
}

/** Group tasks by column, preserving relative order. Never mutates. */
export function tasksByStatus(tasks: KanbanTask[]): Record<KanbanStatus, KanbanTask[]> {
  const grouped: Record<KanbanStatus, KanbanTask[]> = { todo: [], 'in-progress': [], done: [] }
  for (const task of tasks) grouped[task.status].push(task)
  return grouped
}

/** Count tasks per column. */
export function countByStatus(tasks: KanbanTask[]): Record<KanbanStatus, number> {
  const counts: Record<KanbanStatus, number> = { todo: 0, 'in-progress': 0, done: 0 }
  for (const task of tasks) counts[task.status]++
  return counts
}

/**
 * Move `id` into `status`, placed before `beforeId` (`null` appends to the end
 * of the target column). Returns the same array reference when the task, the
 * anchor or the resulting position is invalid or unchanged.
 */
export function moveTask(
  tasks: KanbanTask[],
  id: string,
  status: KanbanStatus,
  beforeId: string | null,
  now: number,
): KanbanTask[] {
  const source = tasks.find((task) => task.id === id)
  if (!source) return tasks

  if (beforeId !== null) {
    if (beforeId === id) return tasks
    const anchor = tasks.find((task) => task.id === beforeId)
    if (!anchor || anchor.status !== status) return tasks
  }

  const rest = tasks.filter((task) => task.id !== id)
  let insertAt: number
  if (beforeId !== null) {
    const anchorIndex = rest.findIndex((task) => task.id === beforeId)
    insertAt = anchorIndex === -1 ? rest.length : anchorIndex
  } else {
    const lastInColumn = rest.reduce(
      (last, task, index) => (task.status === status ? index : last),
      -1,
    )
    insertAt = lastInColumn === -1 ? rest.length : lastInColumn + 1
  }

  const completedAt =
    status === 'done' ? (source.status === 'done' ? source.completedAt : now) : null
  const moved: KanbanTask = { ...source, status, completedAt }

  const next = [...rest.slice(0, insertAt), moved, ...rest.slice(insertAt)]

  const sameOrder = next.every((task, index) => task.id === tasks[index]?.id)
  const unchanged =
    sameOrder && moved.status === source.status && completedAt === source.completedAt
  return unchanged ? tasks : next
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isStatus(value: unknown): value is KanbanStatus {
  return STATUSES.some((status) => status === value)
}

/**
 * Sanitize persisted data: never throws, drops invalid entries and duplicate
 * ids, and coerces every remaining field to the `KanbanTask` shape.
 */
export function normalizeTasks(raw: unknown): KanbanTask[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: KanbanTask[] = []
  for (const entry of raw) {
    if (!isRecord(entry)) continue
    const id = entry.id
    const text = entry.text
    if (typeof id !== 'string' || !id) continue
    if (typeof text !== 'string' || !text.trim()) continue
    if (seen.has(id)) continue
    seen.add(id)
    const status = isStatus(entry.status) ? entry.status : 'todo'
    const createdAt = finiteNumber(entry.createdAt) ?? 0
    const completedAt = status === 'done' ? finiteNumber(entry.completedAt) : null
    result.push({ id, text: text.trim(), status, createdAt, completedAt })
  }
  return result
}
