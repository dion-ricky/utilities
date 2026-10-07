import { diffArrays, diffWords } from 'diff'

export interface DiffRow {
  type: 'same' | 'added' | 'removed'
  text: string
}

export interface DiffTextOptions {
  wordLevel?: boolean
  ignoreCase?: boolean
  ignoreWhitespace?: boolean
}

export interface DiffTextResult {
  unified: string
  added: number
  removed: number
  sideBySide: { left: DiffRow[]; right: DiffRow[] }
}

type DiffChunk = { type: 'same' | 'added' | 'removed'; tokens: string[] }

/**
 * Compare two texts. Line-level diffing uses a custom comparator so that
 * `ignoreCase` and `ignoreWhitespace` both apply; word-level diffing uses
 * jsdiff's `diffWords`, which is inherently whitespace-insensitive
 * (tokens are compared trimmed) and supports `ignoreCase` natively.
 */
export function diffText(a: string, b: string, options: DiffTextOptions = {}): DiffTextResult {
  const ignoreCase = options.ignoreCase ?? false
  const ignoreWhitespace = options.ignoreWhitespace ?? false

  const chunks: DiffChunk[] = options.wordLevel
    ? diffWords(a, b, { ignoreCase }).map((change) => ({
        type: change.added ? 'added' : change.removed ? 'removed' : 'same',
        tokens: change.value.split('\n'),
      }))
    : diffArrays(a.split('\n'), b.split('\n'), {
        comparator: (x, y) => {
          let left = x
          let right = y
          if (ignoreWhitespace) {
            left = left.trim()
            right = right.trim()
          }
          if (ignoreCase) {
            left = left.toLowerCase()
            right = right.toLowerCase()
          }
          return left === right
        },
      }).map((change) => ({
        type: change.added ? 'added' : change.removed ? 'removed' : 'same',
        tokens: change.value,
      }))

  let added = 0
  let removed = 0
  const unifiedLines: string[] = ['*** original', '+++ changed']
  for (const chunk of chunks) {
    const prefix = chunk.type === 'added' ? '+' : chunk.type === 'removed' ? '-' : ' '
    for (const token of chunk.tokens) {
      unifiedLines.push(prefix + token)
    }
    if (chunk.type === 'added') added += chunk.tokens.length
    if (chunk.type === 'removed') removed += chunk.tokens.length
  }

  return {
    unified: unifiedLines.join('\n'),
    added,
    removed,
    sideBySide: buildSideBySide(chunks),
  }
}

function emptyRow(): DiffRow {
  return { type: 'same', text: '' }
}

function buildSideBySide(chunks: DiffChunk[]): { left: DiffRow[]; right: DiffRow[] } {
  const left: DiffRow[] = []
  const right: DiffRow[] = []
  let i = 0
  while (i < chunks.length) {
    const chunk = chunks[i]
    if (!chunk) break
    if (chunk.type === 'same') {
      for (const text of chunk.tokens) {
        left.push({ type: 'same', text })
        right.push({ type: 'same', text })
      }
      i += 1
    } else if (chunk.type === 'removed') {
      const removedRows: DiffRow[] = chunk.tokens.map((text) => ({ type: 'removed', text }))
      const next = chunks[i + 1]
      if (next && next.type === 'added') {
        const addedRows: DiffRow[] = next.tokens.map((text) => ({ type: 'added', text }))
        const len = Math.max(removedRows.length, addedRows.length)
        for (let k = 0; k < len; k++) {
          left.push(removedRows[k] ?? emptyRow())
          right.push(addedRows[k] ?? emptyRow())
        }
        i += 2
      } else {
        for (const row of removedRows) {
          left.push(row)
          right.push(emptyRow())
        }
        i += 1
      }
    } else {
      for (const text of chunk.tokens) {
        left.push(emptyRow())
        right.push({ type: 'added', text })
      }
      i += 1
    }
  }
  // Keep both columns the same height so rows stay aligned in the grid.
  while (left.length < right.length) left.push(emptyRow())
  while (right.length < left.length) right.push(emptyRow())
  return { left, right }
}
