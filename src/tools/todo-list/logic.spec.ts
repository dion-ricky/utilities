import { describe, expect, it } from 'vitest'
import {
  addTodo,
  COMPLETED_OPEN_STORAGE_KEY,
  clearCompleted,
  countTodos,
  createTodo,
  filterTodos,
  normalizeTodos,
  removeTodo,
  reorderTodos,
  STORAGE_KEY,
  splitTodos,
  type TodoItem,
  toggleTodo,
  updateTodoText,
} from './logic'

function item(id: string, text: string, done = false, completedAt: number | null = null): TodoItem {
  return { id, text, done, createdAt: 1, completedAt }
}

const alpha = item('a', 'Alpha')
const beta = item('b', 'Beta')
const gamma = item('c', 'Gamma', true, 5)

function snapshot(items: TodoItem[]): TodoItem[] {
  return items.map((todo) => ({ ...todo }))
}

describe('STORAGE_KEY', () => {
  it('uses the dsk namespace', () => {
    expect(STORAGE_KEY).toBe('dsk.todos')
  })
})

describe('createTodo', () => {
  it('trims text and fills defaults', () => {
    expect(createTodo('  Buy milk  ', 'id-1', 123)).toEqual({
      id: 'id-1',
      text: 'Buy milk',
      done: false,
      completedAt: null,
      createdAt: 123,
    })
  })

  it('returns null for blank text', () => {
    expect(createTodo('', 'id-1', 123)).toBeNull()
    expect(createTodo('   ', 'id-1', 123)).toBeNull()
  })
})

describe('addTodo', () => {
  it('appends a new item without mutating the input', () => {
    const original = [alpha]
    const before = snapshot(original)
    const next = addTodo(original, '  Beta  ', 'b', 2)

    expect(next).not.toBe(original)
    expect(original).toEqual(before)
    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ id: 'b', text: 'Beta', done: false, createdAt: 2, completedAt: null })
  })

  it('returns the same reference for blank text', () => {
    const original = [alpha]
    expect(addTodo(original, '   ', 'b', 2)).toBe(original)
  })
})

describe('toggleTodo', () => {
  it('completes with a timestamp and un-completes with null', () => {
    const completed = toggleTodo([alpha, beta], 'a', 42)
    expect(completed[0]).toEqual({ ...alpha, done: true, completedAt: 42 })

    const reopened = toggleTodo(completed, 'a', 99)
    expect(reopened[0]).toEqual({ ...alpha, done: false, completedAt: null })
  })

  it('does not mutate the input and keeps other items untouched', () => {
    const original = [alpha, beta]
    const before = snapshot(original)
    const next = toggleTodo(original, 'a', 42)

    expect(original).toEqual(before)
    expect(next[1]).toBe(beta)
  })

  it('returns the same reference for an unknown id', () => {
    const original = [alpha]
    expect(toggleTodo(original, 'missing', 42)).toBe(original)
  })
})

describe('updateTodoText', () => {
  it('trims and replaces the text in a new array', () => {
    const original = [alpha, beta]
    const before = snapshot(original)
    const next = updateTodoText(original, 'a', '  Alpha two  ')

    expect(next).not.toBe(original)
    expect(original).toEqual(before)
    expect(next[0]).toEqual({ ...alpha, text: 'Alpha two' })
    expect(next[1]).toBe(beta)
  })

  it('returns the same reference for blank text, unchanged text or an unknown id', () => {
    const original = [alpha]
    expect(updateTodoText(original, 'a', '   ')).toBe(original)
    expect(updateTodoText(original, 'a', 'Alpha')).toBe(original)
    expect(updateTodoText(original, 'a', '  Alpha  ')).toBe(original)
    expect(updateTodoText(original, 'missing', 'Other')).toBe(original)
  })
})

describe('removeTodo', () => {
  it('removes matching items without mutating the input', () => {
    const original = [alpha, beta]
    const before = snapshot(original)
    const next = removeTodo(original, 'a')

    expect(next).toEqual([beta])
    expect(original).toEqual(before)
  })

  it('returns the same reference for an unknown id', () => {
    const original = [alpha]
    expect(removeTodo(original, 'missing')).toBe(original)
  })
})

describe('clearCompleted', () => {
  it('drops completed items without mutating the input', () => {
    const original = [alpha, beta, gamma]
    const before = snapshot(original)
    const next = clearCompleted(original)

    expect(next).toEqual([alpha, beta])
    expect(original).toEqual(before)
  })

  it('returns the same reference when nothing is completed', () => {
    const original = [alpha, beta]
    expect(clearCompleted(original)).toBe(original)
  })
})

describe('filterTodos', () => {
  const items = [alpha, beta, gamma]

  it('returns all items in insertion order', () => {
    expect(filterTodos(items, 'all')).toEqual(items)
  })

  it('returns only active or only completed items', () => {
    expect(filterTodos(items, 'active')).toEqual([alpha, beta])
    expect(filterTodos(items, 'completed')).toEqual([gamma])
  })

  it('never mutates the input', () => {
    const before = snapshot(items)
    filterTodos(items, 'active')
    filterTodos(items, 'completed')
    filterTodos(items, 'all')
    expect(items).toEqual(before)
  })
})

describe('COMPLETED_OPEN_STORAGE_KEY', () => {
  it('uses the dsk namespace', () => {
    expect(COMPLETED_OPEN_STORAGE_KEY).toBe('dsk.todos.completedOpen')
  })
})

describe('splitTodos', () => {
  it('partitions by completion while preserving relative order', () => {
    const first = item('a', 'Alpha')
    const doneFirst = item('b', 'Beta', true, 2)
    const second = item('c', 'Gamma')
    const doneSecond = item('d', 'Delta', true, 3)

    const sections = splitTodos([first, doneFirst, second, doneSecond])

    expect(sections.active).toEqual([first, second])
    expect(sections.completed).toEqual([doneFirst, doneSecond])
  })

  it('returns empty parts for an empty input', () => {
    expect(splitTodos([])).toEqual({ active: [], completed: [] })
  })

  it('never mutates the input and returns new arrays', () => {
    const original = [alpha, gamma, beta]
    const before = snapshot(original)
    const sections = splitTodos(original)

    expect(original).toEqual(before)
    expect(sections.active).not.toBe(original)
    expect(sections.completed).not.toBe(original)
  })
})

describe('reorderTodos', () => {
  it('moves an item down', () => {
    const next = reorderTodos([alpha, beta, gamma], 'a', 'b', 'after')
    expect(next.map((todo) => todo.id)).toEqual(['b', 'a', 'c'])
  })

  it('moves an item up', () => {
    const next = reorderTodos([alpha, beta, gamma], 'c', 'a', 'before')
    expect(next.map((todo) => todo.id)).toEqual(['c', 'a', 'b'])
  })

  it('inserts after the last item', () => {
    const next = reorderTodos([alpha, beta, gamma], 'a', 'c', 'after')
    expect(next.map((todo) => todo.id)).toEqual(['b', 'c', 'a'])
  })

  it('keeps each section order when moving across an interleaved completed item', () => {
    const done = item('b', 'Beta', true, 2)
    const next = reorderTodos([alpha, done, gamma], 'c', 'a', 'before')

    expect(next.map((todo) => todo.id)).toEqual(['c', 'a', 'b'])
    expect(next.find((todo) => todo.id === 'b')?.done).toBe(true)
  })

  it('returns the same reference for no-op moves', () => {
    const original = [alpha, beta, gamma]
    expect(reorderTodos(original, 'a', 'a', 'before')).toBe(original)
    expect(reorderTodos(original, 'missing', 'b', 'before')).toBe(original)
    expect(reorderTodos(original, 'a', 'missing', 'before')).toBe(original)
    expect(reorderTodos(original, 'a', 'b', 'before')).toBe(original)
  })

  it('never mutates the input', () => {
    const original = [alpha, beta, gamma]
    const before = snapshot(original)
    reorderTodos(original, 'c', 'a', 'before')
    expect(original).toEqual(before)
  })
})

describe('countTodos', () => {
  it('counts total, active and completed', () => {
    expect(countTodos([])).toEqual({ total: 0, active: 0, completed: 0 })
    expect(countTodos([alpha, beta, gamma])).toEqual({ total: 3, active: 2, completed: 1 })
  })
})

describe('normalizeTodos', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeTodos(null)).toEqual([])
    expect(normalizeTodos(undefined)).toEqual([])
    expect(normalizeTodos('nope')).toEqual([])
    expect(normalizeTodos({ id: 'a', text: 'Alpha' })).toEqual([])
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
    expect(normalizeTodos(raw)).toEqual([])
  })

  it('coerces done, createdAt and completedAt', () => {
    const raw = [
      { id: 'a', text: 'Alpha' },
      { id: 'b', text: 'Beta', done: 'yes', createdAt: Number.POSITIVE_INFINITY },
      { id: 'c', text: 'Gamma', done: true, createdAt: 12, completedAt: 34 },
      { id: 'd', text: 'Delta', done: false, completedAt: 56 },
      { id: 'e', text: 'Epsilon', done: true, completedAt: Number.NaN },
    ]

    expect(normalizeTodos(raw)).toEqual([
      { id: 'a', text: 'Alpha', done: false, createdAt: 0, completedAt: null },
      { id: 'b', text: 'Beta', done: false, createdAt: 0, completedAt: null },
      { id: 'c', text: 'Gamma', done: true, createdAt: 12, completedAt: 34 },
      { id: 'd', text: 'Delta', done: false, createdAt: 0, completedAt: null },
      { id: 'e', text: 'Epsilon', done: true, createdAt: 0, completedAt: null },
    ])
  })

  it('keeps the first occurrence of a duplicate id', () => {
    const raw = [
      { id: 'a', text: 'First', done: false, createdAt: 1 },
      { id: 'a', text: 'Second', done: true, createdAt: 2 },
    ]
    expect(normalizeTodos(raw)).toEqual([
      { id: 'a', text: 'First', done: false, createdAt: 1, completedAt: null },
    ])
  })

  it('always returns fresh objects', () => {
    const raw = { id: 'a', text: 'Alpha', done: false, createdAt: 1, completedAt: null }
    const normalized = normalizeTodos([raw])
    expect(normalized[0]).not.toBe(raw)
  })
})
