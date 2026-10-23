import { describe, expect, it } from 'vitest'
import {
  addTask,
  clearDone,
  countByStatus,
  createTask,
  type KanbanStatus,
  type KanbanTask,
  moveTask,
  normalizeTasks,
  removeTask,
  STATUS_LABELS,
  STATUSES,
  STORAGE_KEY,
  tasksByStatus,
  updateTaskText,
} from './logic'

function task(
  id: string,
  text: string,
  status: KanbanStatus = 'todo',
  completedAt: number | null = null,
): KanbanTask {
  return { id, text, status, createdAt: 1, completedAt }
}

const alpha = task('a', 'Alpha')
const beta = task('b', 'Beta')
const delta = task('d', 'Delta')
const gamma = task('c', 'Gamma', 'done', 5)

function snapshot(tasks: KanbanTask[]): KanbanTask[] {
  return tasks.map((entry) => ({ ...entry }))
}

function ids(tasks: KanbanTask[]): string[] {
  return tasks.map((entry) => entry.id)
}

describe('STORAGE_KEY', () => {
  it('uses the dsk namespace', () => {
    expect(STORAGE_KEY).toBe('dsk.kanban.tasks')
  })
})

describe('STATUSES', () => {
  it('lists the three columns in board order', () => {
    expect(STATUSES).toEqual(['todo', 'in-progress', 'done'])
  })

  it('labels every column', () => {
    expect(STATUS_LABELS).toEqual({ todo: 'To do', 'in-progress': 'In progress', done: 'Done' })
  })
})

describe('createTask', () => {
  it('trims text and fills defaults', () => {
    expect(createTask('  Ship it  ', 'todo', 'id-1', 123)).toEqual({
      id: 'id-1',
      text: 'Ship it',
      status: 'todo',
      createdAt: 123,
      completedAt: null,
    })
  })

  it('stamps completedAt only for the done column', () => {
    expect(createTask('Done thing', 'done', 'id-2', 77)?.completedAt).toBe(77)
    expect(createTask('Doing thing', 'in-progress', 'id-3', 77)?.completedAt).toBeNull()
  })

  it('returns null for blank text', () => {
    expect(createTask('', 'todo', 'id-1', 123)).toBeNull()
    expect(createTask('   ', 'done', 'id-1', 123)).toBeNull()
  })
})

describe('addTask', () => {
  it('appends a new task with the injected id and timestamp', () => {
    const original = [alpha]
    const before = snapshot(original)
    const next = addTask(original, '  Beta  ', 'in-progress', 'b', 2)

    expect(next).not.toBe(original)
    expect(original).toEqual(before)
    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({
      id: 'b',
      text: 'Beta',
      status: 'in-progress',
      createdAt: 2,
      completedAt: null,
    })
  })

  it('returns the same reference for blank text', () => {
    const original = [alpha]
    expect(addTask(original, '   ', 'todo', 'b', 2)).toBe(original)
  })
})

describe('moveTask', () => {
  it('reorders within a column by inserting before the anchor', () => {
    const next = moveTask([alpha, beta, delta], 'd', 'todo', 'a', 9)
    expect(ids(next)).toEqual(['d', 'a', 'b'])
  })

  it('reorders within a column by appending to the end', () => {
    const next = moveTask([alpha, beta], 'a', 'todo', null, 9)
    expect(ids(next)).toEqual(['b', 'a'])
    expect(next.find((entry) => entry.id === 'a')?.status).toBe('todo')
  })

  it('moves a task down one position', () => {
    const next = moveTask([alpha, beta, delta], 'a', 'todo', 'd', 9)
    expect(ids(next)).toEqual(['b', 'a', 'd'])
  })

  it('moves a task up one position', () => {
    const next = moveTask([alpha, beta], 'b', 'todo', 'a', 9)
    expect(ids(next)).toEqual(['b', 'a'])
  })

  it('moves across columns and changes status', () => {
    const next = moveTask([alpha, beta], 'a', 'in-progress', null, 9)
    expect(ids(next)).toEqual(['b', 'a'])
    expect(next[1]?.status).toBe('in-progress')
  })

  it('changes status even when the resulting order is unchanged', () => {
    const done = task('d', 'Done first', 'done', 4)
    const source = task('e', 'Move me', 'in-progress')
    const original = [done, source]
    const next = moveTask(original, 'e', 'done', null, 42)

    expect(next).not.toBe(original)
    expect(ids(next)).toEqual(['d', 'e'])
    expect(next[1]).toEqual({ ...source, status: 'done', completedAt: 42 })
  })

  it('stamps completedAt when entering done', () => {
    const next = moveTask([alpha], 'a', 'done', null, 42)
    expect(next[0]).toEqual({ ...alpha, status: 'done', completedAt: 42 })
  })

  it('preserves completedAt when reordering inside done', () => {
    const first = task('x', 'First', 'done', 5)
    const second = task('y', 'Second', 'done', 7)
    const next = moveTask([first, second], 'y', 'done', 'x', 99)

    expect(ids(next)).toEqual(['y', 'x'])
    expect(next[0]?.completedAt).toBe(7)
  })

  it('clears completedAt when leaving done', () => {
    const next = moveTask([gamma], 'c', 'in-progress', null, 42)
    expect(next[0]).toEqual({ ...gamma, status: 'in-progress', completedAt: null })
  })

  it('appends into an empty target column', () => {
    const next = moveTask([alpha, beta], 'a', 'done', null, 42)
    expect(ids(next)).toEqual(['b', 'a'])
    expect(next[1]).toEqual({ ...alpha, status: 'done', completedAt: 42 })
  })

  it('returns the same reference for no-op moves', () => {
    const original = [alpha, beta, gamma]
    // dropping a task onto itself
    expect(moveTask(original, 'a', 'todo', 'a', 9)).toBe(original)
    // unknown task id
    expect(moveTask(original, 'missing', 'todo', null, 9)).toBe(original)
    // unknown anchor id
    expect(moveTask(original, 'a', 'todo', 'missing', 9)).toBe(original)
    // anchor lives in a different column
    expect(moveTask(original, 'a', 'todo', 'c', 9)).toBe(original)
    // already directly before the anchor
    expect(moveTask(original, 'a', 'todo', 'b', 9)).toBe(original)
    // appending the last task of its column
    const atEnd = [alpha, beta]
    expect(moveTask(atEnd, 'b', 'todo', null, 9)).toBe(atEnd)
  })

  it('never mutates the input array or its task objects', () => {
    const original = [alpha, beta, gamma]
    const before = snapshot(original)
    moveTask(original, 'c', 'todo', 'a', 9)
    expect(original).toEqual(before)
    expect(original[0]).toBe(alpha)
  })
})

describe('clearDone', () => {
  it('drops done tasks and keeps the rest in order', () => {
    const next = clearDone([alpha, gamma, beta])
    expect(next).toEqual([alpha, beta])
  })

  it('returns the same reference when nothing is done', () => {
    const original = [alpha, beta]
    expect(clearDone(original)).toBe(original)
  })

  it('never mutates the input', () => {
    const original = [alpha, gamma, beta]
    const before = snapshot(original)
    clearDone(original)
    expect(original).toEqual(before)
  })
})

describe('updateTaskText', () => {
  it('trims and replaces the text in a new array', () => {
    const original = [alpha, beta]
    const before = snapshot(original)
    const next = updateTaskText(original, 'a', '  Alpha two  ')

    expect(next).not.toBe(original)
    expect(original).toEqual(before)
    expect(next[0]).toEqual({ ...alpha, text: 'Alpha two' })
    expect(next[1]).toBe(beta)
  })

  it('returns the same reference for blank text, unchanged text or an unknown id', () => {
    const original = [alpha]
    expect(updateTaskText(original, 'a', '   ')).toBe(original)
    expect(updateTaskText(original, 'a', 'Alpha')).toBe(original)
    expect(updateTaskText(original, 'a', '  Alpha  ')).toBe(original)
    expect(updateTaskText(original, 'missing', 'Other')).toBe(original)
  })
})

describe('removeTask', () => {
  it('removes matching tasks without mutating the input', () => {
    const original = [alpha, beta]
    const before = snapshot(original)
    const next = removeTask(original, 'a')

    expect(next).toEqual([beta])
    expect(original).toEqual(before)
  })

  it('returns the same reference for an unknown id', () => {
    const original = [alpha]
    expect(removeTask(original, 'missing')).toBe(original)
  })
})

describe('tasksByStatus', () => {
  it('groups by column while preserving relative order', () => {
    const first = task('a', 'Alpha')
    const doing = task('b', 'Beta', 'in-progress')
    const doneFirst = task('c', 'Gamma', 'done', 2)
    const second = task('d', 'Delta')

    const grouped = tasksByStatus([first, doing, doneFirst, second])

    expect(grouped.todo).toEqual([first, second])
    expect(grouped['in-progress']).toEqual([doing])
    expect(grouped.done).toEqual([doneFirst])
  })

  it('returns empty groups for an empty input', () => {
    expect(tasksByStatus([])).toEqual({ todo: [], 'in-progress': [], done: [] })
  })

  it('never mutates the input and returns new arrays', () => {
    const original = [alpha, gamma, beta]
    const before = snapshot(original)
    const grouped = tasksByStatus(original)

    expect(original).toEqual(before)
    expect(grouped.todo).not.toBe(original)
    expect(grouped.done).not.toBe(original)
  })
})

describe('countByStatus', () => {
  it('counts tasks per column', () => {
    expect(countByStatus([])).toEqual({ todo: 0, 'in-progress': 0, done: 0 })
    expect(countByStatus([alpha, beta, gamma])).toEqual({ todo: 2, 'in-progress': 0, done: 1 })
  })
})

describe('normalizeTasks', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeTasks(null)).toEqual([])
    expect(normalizeTasks(undefined)).toEqual([])
    expect(normalizeTasks('nope')).toEqual([])
    expect(normalizeTasks({ nope: 1 })).toEqual([])
  })

  it('drops invalid entries without throwing', () => {
    const raw = [
      null,
      42,
      'text',
      [],
      { id: '', text: 'No id' },
      { id: 'x', text: '' },
      { id: 'y', text: '   ' },
      { id: 1, text: 'Bad id' },
      { id: 'z', text: 5 },
    ]
    expect(normalizeTasks(raw)).toEqual([])
  })

  it('coerces invalid status to todo and completedAt accordingly', () => {
    const raw = [
      { id: 'a', text: 'Alpha' },
      { id: 'b', text: 'Beta', status: 'archived', completedAt: 34 },
      { id: 'c', text: 'Gamma', status: 'done', completedAt: 34 },
      { id: 'd', text: 'Delta', status: 'in-progress', completedAt: 56 },
    ]

    expect(normalizeTasks(raw)).toEqual([
      { id: 'a', text: 'Alpha', status: 'todo', createdAt: 0, completedAt: null },
      { id: 'b', text: 'Beta', status: 'todo', createdAt: 0, completedAt: null },
      { id: 'c', text: 'Gamma', status: 'done', createdAt: 0, completedAt: 34 },
      { id: 'd', text: 'Delta', status: 'in-progress', createdAt: 0, completedAt: null },
    ])
  })

  it('coerces createdAt and completedAt to finite numbers', () => {
    const raw = [
      { id: 'a', text: 'Alpha', createdAt: Number.POSITIVE_INFINITY },
      { id: 'b', text: 'Beta', status: 'done', createdAt: 12, completedAt: Number.NaN },
      { id: 'c', text: 'Gamma', status: 'done', createdAt: 12, completedAt: 34 },
    ]

    expect(normalizeTasks(raw)).toEqual([
      { id: 'a', text: 'Alpha', status: 'todo', createdAt: 0, completedAt: null },
      { id: 'b', text: 'Beta', status: 'done', createdAt: 12, completedAt: null },
      { id: 'c', text: 'Gamma', status: 'done', createdAt: 12, completedAt: 34 },
    ])
  })

  it('keeps the first occurrence of a duplicate id', () => {
    const raw = [
      { id: 'a', text: 'First', status: 'todo', createdAt: 1 },
      { id: 'a', text: 'Second', status: 'done', createdAt: 2 },
    ]
    expect(normalizeTasks(raw)).toEqual([
      { id: 'a', text: 'First', status: 'todo', createdAt: 1, completedAt: null },
    ])
  })

  it('always returns fresh objects', () => {
    const raw = {
      id: 'a',
      text: 'Alpha',
      status: 'todo',
      createdAt: 1,
      completedAt: null,
    }
    const normalized = normalizeTasks([raw])
    expect(normalized[0]).not.toBe(raw)
  })
})
