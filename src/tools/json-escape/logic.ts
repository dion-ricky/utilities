export interface JsonEscapeOptions {
  /** Wrap the escaped text in surrounding double quotes, producing a complete JSON string literal. */
  wrap?: boolean
}

const CONTROL_SHORT: Record<string, string> = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
}

/**
 * Escapes a raw string so it is safe to embed inside a JSON string literal:
 * backslash, double quote, and control characters. Matches JSON.stringify
 * semantics for a single string value (single quotes need no escaping in JSON).
 */
export function escapeJsonString(text: string, options: JsonEscapeOptions = {}): string {
  let out = ''
  for (const char of text) {
    const short = CONTROL_SHORT[char]
    if (short !== undefined) {
      out += short
      continue
    }
    if (char === '\\' || char === '"') {
      out += `\\${char}`
      continue
    }
    const codePoint = char.codePointAt(0) ?? 0
    if (codePoint < 0x20) {
      out += `\\u${codePoint.toString(16).padStart(4, '0')}`
      continue
    }
    out += char
  }
  return options.wrap ? `"${out}"` : out
}

/**
 * Reverses escapeJsonString. Accepts a complete JSON string literal (wrapped in
 * quotes) or bare escaped text (unwrapped), and throws a friendly error on
 * malformed input such as unescaped quotes or raw newlines.
 */
export function unescapeJsonString(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (typeof parsed === 'string') return parsed
    } catch {
      // Not a valid JSON literal — try treating it as bare escaped text below.
    }
  }
  try {
    const parsed: unknown = JSON.parse(`"${trimmed}"`)
    if (typeof parsed === 'string') return parsed
  } catch {
    throw new Error(
      'Not a valid JSON string — check for unescaped quotes, raw newlines, or stray backslashes.',
    )
  }
  throw new Error('Not a valid JSON string.')
}
