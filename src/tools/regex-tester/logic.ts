export const VALID_FLAGS = ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y'] as const

export const MAX_MATCHES = 200

export interface ParsedFlags {
  valid: string[]
  invalid: string[]
}

export interface RegexMatch {
  index: number
  text: string
  groups: string[]
  namedGroups: Record<string, string>
}

export type FindMatchesResult =
  | { ok: true; matches: RegexMatch[]; total: number; truncated: boolean }
  | { ok: false; error: string }

export type ReplaceResult = { ok: true; result: string } | { ok: false; error: string }

/** Split a flags string into valid and invalid JavaScript regex flags (duplicates removed). */
export function parseFlags(flags: string): ParsedFlags {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const char of flags) {
    if (char === ' ') continue
    if (seen.has(char)) continue
    seen.add(char)
    if ((VALID_FLAGS as readonly string[]).includes(char)) {
      valid.push(char)
    } else {
      invalid.push(char)
    }
  }
  return { valid, invalid }
}

/** Build a RegExp, returning a friendly error message instead of throwing. */
function buildRegex(pattern: string, flags: string): RegExp | { error: string } {
  try {
    return new RegExp(pattern, flags)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: `Invalid regular expression: ${message}` }
  }
}

/**
 * Find all matches of `pattern` in `text`.
 * Guards against infinite loops on zero-length matches by advancing the search position.
 * The list of returned matches is capped at MAX_MATCHES (the total is still counted).
 */
export function findMatches(pattern: string, flags: string, text: string): FindMatchesResult {
  if (pattern === '') {
    return { ok: false, error: 'Enter a pattern to test.' }
  }
  const { invalid } = parseFlags(flags)
  if (invalid.length > 0) {
    return { ok: false, error: `Unsupported flag(s): ${invalid.join(', ')}` }
  }
  const built = buildRegex(pattern, flags)
  if ('error' in built) {
    return { ok: false, error: built.error }
  }
  const re = built
  const global = re.global

  const matches: RegexMatch[] = []
  let total = 0
  let position = 0
  const maxIterations = text.length + MAX_MATCHES * 2 + 10

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (position > text.length) break
    re.lastIndex = global ? position : 0
    const match = re.exec(text)
    if (!match) break

    const matchText = match[0]
    const index = match.index
    total++
    if (matches.length < MAX_MATCHES) {
      const groups: string[] = []
      for (let i = 1; i < match.length; i++) {
        groups.push(match[i] ?? '')
      }
      matches.push({
        index,
        text: matchText,
        groups,
        namedGroups: { ...match.groups },
      })
    }

    if (!global) break
    if (index === re.lastIndex) {
      // Zero-length match: advance manually to avoid an infinite loop.
      position = index + 1
    } else {
      position = re.lastIndex
    }
  }

  return { ok: true, matches, total, truncated: total > matches.length }
}

/** Escape HTML special characters in plain text. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Build an HTML string where matched regions are wrapped in <mark>.
 * All plain text is HTML-escaped before insertion, so the result is safe for v-html.
 * Zero-length and overlapping matches are not highlighted.
 */
export function highlightHtml(text: string, matches: RegexMatch[]): string {
  const sorted = [...matches].sort((a, b) => a.index - b.index)
  let html = ''
  let pos = 0
  for (const match of sorted) {
    if (match.index < pos) continue
    if (match.text.length === 0) continue
    html += escapeHtml(text.slice(pos, match.index))
    html += `<mark>${escapeHtml(match.text)}</mark>`
    pos = match.index + match.text.length
  }
  html += escapeHtml(text.slice(pos))
  return html
}

/** Apply a replacement string (with $1 group references) via String.replace. */
export function replacePreview(
  text: string,
  pattern: string,
  flags: string,
  replacement: string,
): ReplaceResult {
  if (pattern === '') {
    return { ok: false, error: 'Enter a pattern to test.' }
  }
  const { invalid } = parseFlags(flags)
  if (invalid.length > 0) {
    return { ok: false, error: `Unsupported flag(s): ${invalid.join(', ')}` }
  }
  const built = buildRegex(pattern, flags)
  if ('error' in built) {
    return { ok: false, error: built.error }
  }
  try {
    return { ok: true, result: text.replace(built, replacement) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Replacement failed: ${message}` }
  }
}
