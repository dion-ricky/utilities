export type JsonIndent = '2' | '4' | 'tab' | 'none'

export interface FormatJsonOptions {
  indent: JsonIndent
  sortKeys?: boolean
}

export type JsonFormatResult = { ok: true; result: string } | { ok: false; error: string }

/**
 * Extract the character position from a JSON.parse error message
 * (V8 style: `... at position 123`). Returns null when absent.
 */
export function jsonErrorPosition(message: string): number | null {
  const match = /position (\d+)/i.exec(message)
  return match ? Number(match[1]) : null
}

/**
 * Convert a 0-based character offset into a 1-based line/column pair.
 * Positions past the end of the text are clamped to the end.
 */
export function positionToLineCol(text: string, position: number): { line: number; col: number } {
  const clamped = Math.max(0, Math.min(position, text.length))
  const lines = text.slice(0, clamped).split('\n')
  const lastLine = lines[lines.length - 1] ?? ''
  return { line: lines.length, col: lastLine.length + 1 }
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortValue(source[key])
    }
    return sorted
  }
  return value
}

function indentToString(indent: JsonIndent): string | number | undefined {
  switch (indent) {
    case '2':
      return 2
    case '4':
      return 4
    case 'tab':
      return '\t'
    case 'none':
      return undefined
  }
}

export function formatJson(input: string, options: FormatJsonOptions): JsonFormatResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const position = jsonErrorPosition(message)
    if (position !== null) {
      const { line, col } = positionToLineCol(input, position)
      return {
        ok: false,
        error: `Invalid JSON at line ${line}, column ${col} — ${message}`,
      }
    }
    return { ok: false, error: `Invalid JSON — ${message}` }
  }

  const value = options.sortKeys ? sortValue(parsed) : parsed
  const space = indentToString(options.indent)
  const result = space === undefined ? JSON.stringify(value) : JSON.stringify(value, null, space)
  return { ok: true, result: result ?? '' }
}
