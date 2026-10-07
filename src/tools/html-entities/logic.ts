const NAMED_ENCODE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export interface HtmlEncodeOptions {
  numericNonAscii?: boolean
}

/** Escapes &, <, >, " and ' with named references (optionally numeric refs for non-ASCII). */
export function encodeHtmlEntities(text: string, options: HtmlEncodeOptions = {}): string {
  let out = ''
  for (const char of text) {
    const named = NAMED_ENCODE[char]
    if (named !== undefined) {
      out += named
      continue
    }
    if (options.numericNonAscii) {
      const codePoint = char.codePointAt(0) ?? 0
      if (codePoint > 127) {
        out += `&#${codePoint};`
        continue
      }
    }
    out += char
  }
  return out
}

// Common named references plus a reasonable set of punctuation, symbols, and Greek letters.
const NAMED_DECODE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  times: '×',
  divide: '÷',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  bull: '•',
  middot: '·',
  deg: '°',
  plusmn: '±',
  micro: 'µ',
  para: '¶',
  sect: '§',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  prime: '′',
  Prime: '″',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  minus: '−',
  lowast: '∗',
  ne: '≠',
  le: '≤',
  ge: '≥',
  infin: '∞',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  pi: 'π',
  sigma: 'σ',
  omega: 'ω',
  Omega: 'Ω',
  mu: 'µ',
}

const ENTITY_PATTERN = /&(?:#x([0-9a-fA-F]+)|#([0-9]+)|([a-zA-Z][a-zA-Z0-9]*));/g

function isValidCodePoint(codePoint: number): boolean {
  return codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
}

/**
 * Decodes named references (amp, lt, nbsp, …) and numeric references (decimal and hex).
 * Unknown or invalid references are left untouched. Pure string processing — no DOM.
 */
export function decodeHtmlEntities(text: string): string {
  return text.replaceAll(ENTITY_PATTERN, (match, hex, dec, name) => {
    if (hex !== undefined) {
      const codePoint = Number.parseInt(hex, 16)
      if (isValidCodePoint(codePoint)) return String.fromCodePoint(codePoint)
      return match
    }
    if (dec !== undefined) {
      const codePoint = Number.parseInt(dec, 10)
      if (isValidCodePoint(codePoint)) return String.fromCodePoint(codePoint)
      return match
    }
    if (name !== undefined && name in NAMED_DECODE) return NAMED_DECODE[name] ?? match
    return match
  })
}
